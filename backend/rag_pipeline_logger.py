"""
Structured logging for RAG chat runs: query, chosen top-k chunks (full text), response, scores.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config import settings

_LOGGER_NAME = "rag_pipeline"
_file_handler: Optional[logging.FileHandler] = None


def _log_dir() -> str:
    base = getattr(settings, "rag_pipeline_log_dir", None) or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "logs"
    )
    return base


def _ensure_file_logger() -> logging.Logger:
    global _file_handler
    log = logging.getLogger(_LOGGER_NAME)
    log.setLevel(logging.INFO)
    if log.handlers:
        return log
    os.makedirs(_log_dir(), exist_ok=True)
    path = getattr(settings, "rag_pipeline_log_file", None) or os.path.join(
        _log_dir(), "rag_pipeline.log"
    )
    _file_handler = logging.FileHandler(path, encoding="utf-8")
    _file_handler.setFormatter(logging.Formatter("%(message)s"))
    log.addHandler(_file_handler)
    log.propagate = False
    return log


def _enabled() -> bool:
    return bool(getattr(settings, "rag_pipeline_logging_enabled", True))


def _emit_block(title: str, payload: Dict[str, Any]) -> None:
    if not _enabled():
        return
    log = _ensure_file_logger()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    sep = "=" * 80
    body = json.dumps(payload, indent=2, ensure_ascii=False, default=str)
    record = f"{sep}\n{title}\n  timestamp_utc: {ts}\n{sep}\n{body}\n{sep}\n"
    log.info(record)


def _scored_chunk_dict(chunk: Any) -> Dict[str, Any]:
    return {
        "chunk_id": chunk.chunk_id,
        "level": chunk.level,
        "retrieval_score": chunk.score,
        "parent_id": chunk.parent_id,
        "metadata": dict(chunk.metadata) if chunk.metadata else {},
        "text_full": chunk.text,
    }


def _validated_result_dict(result: Any) -> Dict[str, Any]:
    supporting = {}
    if result.supporting_chunks:
        for layer, ch in result.supporting_chunks.items():
            supporting[layer] = _scored_chunk_dict(ch)
    return {
        "confidence_score": result.confidence_score,
        "layer_coverage": result.layer_coverage,
        "primary_chunk": _scored_chunk_dict(result.primary_chunk),
        "supporting_chunks_by_layer": supporting,
        "validation_details": result.validation_details or {},
    }


def log_sheet_rag_query(
    *,
    query_text: str,
    top_k: int,
    use_cross_validation: bool,
    cache_hit: bool,
    context_chunks_for_generation: Optional[List[Any]] = None,
    validated_results: Optional[List[Any]] = None,
    result: Dict[str, Any],
) -> None:
    validation = result.get("validation")
    sources = result.get("sources", [])
    response = result.get("response", "")

    if cache_hit:
        # Cached payload: only log up to top_k sources (no live chunk objects).
        sources_limited = (sources or [])[:top_k]
        enriched_sources = [dict(s) for s in sources_limited]
        ctx_list: List[Dict[str, Any]] = []
        validated_list: List[Dict[str, Any]] = []
    else:
        chosen = list((context_chunks_for_generation or [])[:top_k])
        ctx_list = [_scored_chunk_dict(c) for c in chosen]
        id_to_full_text = {c.chunk_id: c.text for c in chosen}
        chosen_order = [c.chunk_id for c in chosen]

        validated_slice = (validated_results or [])[:top_k]
        validated_list = [_validated_result_dict(r) for r in validated_slice]

        enriched_sources = []
        seen_ids: set = set()
        for cid in chosen_order:
            for src in sources:
                if src.get("chunk_id") != cid or cid in seen_ids:
                    continue
                row = dict(src)
                if cid in id_to_full_text:
                    row["text_full"] = id_to_full_text[cid]
                enriched_sources.append(row)
                seen_ids.add(cid)
                break

    confidence_block: Dict[str, Any] = {}
    if isinstance(validation, dict):
        confidence_block = {
            k: validation[k]
            for k in ("avg_confidence", "max_confidence", "min_confidence", "count")
            if k in validation
        }
    per_source_confidence = []
    for i, src in enumerate(enriched_sources):
        row: Dict[str, Any] = {"index": i, "level": src.get("level"), "score": src.get("score")}
        if isinstance(src.get("validation"), dict):
            row["confidence"] = src["validation"].get("confidence")
            row["layer_coverage"] = src["validation"].get("layer_coverage")
            row["supporting_layers"] = src["validation"].get("supporting_layers")
        per_source_confidence.append(row)

    payload: Dict[str, Any] = {
        "engine": "sheet_rag",
        "cache_hit": cache_hit,
        "query": query_text,
        "parameters": {"top_k": top_k, "use_cross_validation": use_cross_validation},
        "top_k_chunks_chosen_for_llm": ctx_list,
        "cross_validation_for_chosen_top_k_only": validated_list,
        "response_text": response,
        "sources_for_chosen_chunks": enriched_sources,
        "confidence": {
            "validation_summary": validation,
            "aggregates_from_validation": confidence_block,
            "per_source": per_source_confidence,
        },
        "layers_searched_counts": result.get("layers_searched"),
    }

    _emit_block("RAG PIPELINE — Sheet RAG", payload)


def log_standard_rag_query(
    *,
    query_text: str,
    top_k: int,
    use_enhancement: bool,
    cache_hit: bool,
    response_text: str,
    source_nodes_summary: List[Dict[str, Any]],
) -> None:
    chosen_nodes = (source_nodes_summary or [])[:top_k]
    payload: Dict[str, Any] = {
        "engine": "standard_llamaindex",
        "cache_hit": cache_hit,
        "query": query_text,
        "parameters": {"top_k": top_k, "use_enhancement": use_enhancement},
        "top_k_chunks_chosen": chosen_nodes,
        "response_text": response_text,
        "confidence": {
            "note": "Per-chunk retrieval scores are embedding similarity; no cross-layer validation.",
            "per_chunk_retrieval_score": [
                {"rank": s.get("rank"), "retrieval_score": s.get("retrieval_score")}
                for s in chosen_nodes
            ],
        },
    }
    _emit_block("RAG PIPELINE — Standard RAG", payload)


def serialize_llama_response_sources(response: Any) -> List[Dict[str, Any]]:
    """Full chunk text + metadata + retrieval score from a LlamaIndex query response."""
    out: List[Dict[str, Any]] = []
    if not hasattr(response, "source_nodes") or not response.source_nodes:
        return out
    for i, node_with_score in enumerate(response.source_nodes, 1):
        n = node_with_score.node
        meta = dict(n.metadata) if n.metadata else {}
        score = getattr(node_with_score, "score", None)
        try:
            score_f = float(score) if score is not None else None
        except (TypeError, ValueError):
            score_f = None
        out.append(
            {
                "rank": i,
                "retrieval_score": score_f,
                "metadata": meta,
                "chunk_text_full": n.get_text(),
            }
        )
    return out
