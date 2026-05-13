import argparse
import logging
import os
import time
from typing import List, Dict, Optional

import requests
from tqdm import tqdm
from llama_index.core import StorageContext, VectorStoreIndex

from ingestion import search_papers, load_documents, normalize_arxiv_id
from papers_library import papers_library
from rag_engine import RAGEngine
from sheet_rag_engine import SheetRAGEngine
from hierarchical_chunker import create_hierarchical_chunks


def _seed_queries() -> List[str]:
    return [
        "retrieval augmented generation",
        "RAG",
        "retrieval-augmented",
        "dense retrieval",
        "vector database",
        "semantic search",
        "information retrieval",
        "question answering",
        "knowledge retrieval",
        "retrieval system",
        "document retrieval",
        "passage retrieval",
    ]


def _collect_candidates(limit: int, queries: List[str]) -> List[Dict]:
    existing = {paper["arxiv_id"] for paper in papers_library.get_all_papers()}
    candidates: Dict[str, Dict] = {}

    for query in tqdm(queries, desc="Querying arXiv", unit="query"):
        if len(candidates) >= limit:
            break
        results = search_papers(query, max_results=80)
        for paper in results:
            arxiv_id = paper.get("arxiv_id")
            if not arxiv_id or arxiv_id in existing:
                continue
            if arxiv_id in candidates:
                continue
            candidates[arxiv_id] = paper
            if len(candidates) >= limit:
                break

    return list(candidates.values())[:limit]


def _download_with_resume(arxiv_id: str, pdf_url: str, download_dir: str = "data/papers") -> str:
    os.makedirs(download_dir, exist_ok=True)
    filename = f"{normalize_arxiv_id(arxiv_id)}.pdf"
    final_path = os.path.join(download_dir, filename)
    temp_path = final_path + ".part"

    if os.path.exists(final_path):
        return final_path

    existing = os.path.getsize(temp_path) if os.path.exists(temp_path) else 0
    headers = {"Range": f"bytes={existing}-"} if existing > 0 else {}

    response = requests.get(pdf_url, stream=True, timeout=(10, 120), headers=headers)
    if response.status_code not in (200, 206):
        raise RuntimeError(f"Download failed with status {response.status_code}")

    content_length = response.headers.get("Content-Length")
    expected_size = existing + int(content_length) if content_length else None

    mode = "ab" if existing > 0 else "wb"
    with open(temp_path, mode) as handle:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                handle.write(chunk)

    if expected_size is not None and os.path.getsize(temp_path) < expected_size:
        raise RuntimeError("Download incomplete")

    os.replace(temp_path, final_path)
    return final_path


def _download_with_retry(arxiv_id: str, pdf_url: str, max_retries: int = 4) -> str:
    backoff = 2.0
    last_error: Optional[Exception] = None

    for attempt in range(1, max_retries + 1):
        try:
            return _download_with_resume(arxiv_id, pdf_url)
        except Exception as exc:
            last_error = exc
            sleep_for = backoff * attempt
            tqdm.write(f"Download retry {attempt}/{max_retries} for {arxiv_id} after error: {exc}")
            time.sleep(sleep_for)

    raise RuntimeError(f"Failed to download {arxiv_id}") from last_error


def ingest_papers(limit: int) -> None:
    # Quiet noisy HTTP logs that break tqdm rendering.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("arxiv").setLevel(logging.WARNING)

    queries = _seed_queries()
    candidates = _collect_candidates(limit, queries)

    if not candidates:
        print("No new papers found to ingest.")
        return

    print(f"Found {len(candidates)} new papers to ingest.")

    rag = RAGEngine()
    sheet_rag = SheetRAGEngine()
    embed_model_name = getattr(sheet_rag.embed_model, "model", "nvidia/nv-embedqa-e5-v5")

    layer_to_key = {
        "sentence": "sentences",
        "paragraph": "paragraphs",
        "section": "sections",
        "summary": "summaries",
    }

    for paper in tqdm(candidates, desc="Ingesting papers", unit="paper"):
        arxiv_id = paper["arxiv_id"]
        title = paper.get("title", "Unknown")
        pdf_url = paper.get("pdf_url")

        try:
            if not pdf_url:
                raise RuntimeError("Missing pdf_url")

            file_path = _download_with_retry(arxiv_id, pdf_url)
            documents = load_documents(file_path)

            chunks_by_level = create_hierarchical_chunks(documents)

            for layer in sheet_rag.LAYERS:
                key = layer_to_key[layer]
                layer_docs = chunks_by_level.get(key, [])

                if not layer_docs:
                    continue

                storage_context = StorageContext.from_defaults(
                    vector_store=sheet_rag.vector_stores[layer]
                )

                if sheet_rag.indexes[layer] is None or sheet_rag.collections[layer].count() == 0:
                    sheet_rag.indexes[layer] = VectorStoreIndex.from_documents(
                        [],
                        storage_context=storage_context,
                    )

                for doc in tqdm(
                    layer_docs,
                    desc=f"{arxiv_id} [{layer}]",
                    unit="chunk",
                    leave=False,
                ):
                    sheet_rag.indexes[layer].insert(doc)

            rag.add_documents(documents)

            papers_library.add_paper(
                arxiv_id=arxiv_id,
                title=title,
                authors=paper.get("authors", []),
                summary=paper.get("summary", ""),
                pages=len(documents)
            )
        except Exception as exc:
            tqdm.write(f"Failed to ingest {arxiv_id}: {exc}")

        time.sleep(0.2)

    print("\nDone.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest 100 LLM/RAG papers not already in the library.")
    parser.add_argument("--limit", type=int, default=100, help="Number of new papers to ingest.")
    args = parser.parse_args()

    ingest_papers(args.limit)


if __name__ == "__main__":
    main()
