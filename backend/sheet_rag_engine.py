"""
Sheet RAG Engine - Multi-Layer RAG Architecture

This engine implements hierarchical embedding across 4 layers:
- Sentence (fine-grained facts)
- Paragraph (contextual information)
- Section (topical grouping)
- Summary (document-level overview)

Cross-layer validation ensures retrieved information is consistent
across abstraction levels, reducing hallucinations.
"""

import os
import time
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import chromadb
from chromadb.config import Settings as ChromaSettings
from llama_index.core import (
    VectorStoreIndex,
    Settings,
    StorageContext,
    Document
)
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.nvidia import NVIDIA
from llama_index.embeddings.nvidia import NVIDIAEmbedding

from config import settings
from cache import cache
from hierarchical_chunker import HierarchicalChunker, create_hierarchical_chunks
from cross_validator import (
    CrossLayerValidator,
    ScoredChunk,
    ValidatedResult,
    create_scored_chunks_from_nodes
)
from rag_pipeline_logger import log_sheet_rag_query
from text_quality import is_boilerplate


class SheetRAGEngine:
    """
    Multi-layer RAG engine with cross-validation for reduced hallucinations.
    
    Architecture:
    - 4 separate ChromaDB collections (one per layer)
    - 4 separate VectorStoreIndex instances
    - Hierarchical chunking preserves parent-child relationships
    - Cross-layer validation filters inconsistent results
    """
    
    # Layer definitions
    LAYERS = ["sentence", "paragraph", "section", "summary"]
    
    # Collection name prefix
    COLLECTION_PREFIX = "sheet_rag"
    
    def __init__(self):
        """Initialize the Sheet RAG engine with multi-layer setup"""
        self.chroma_client = None
        self.collections: Dict[str, Any] = {}
        self.vector_stores: Dict[str, Any] = {}
        self.indexes: Dict[str, Optional[VectorStoreIndex]] = {}
        self.cache = cache
        
        # Initialize components
        self._setup_models()
        self._setup_vector_stores()
        self._load_or_create_indexes()
        
        # Initialize processing components
        self.chunker = HierarchicalChunker()
        self.validator = CrossLayerValidator(
            support_threshold=settings.cross_validation_threshold,
            min_layers=settings.cross_validation_min_layers,
            require_cross_file_support=settings.cross_validation_require_cross_file,
        )
        
        print("[OK] Sheet RAG Engine initialized with 4 layers")
    
    def _setup_models(self):
        """Initialize NVIDIA LLM and embedding models"""
        api_key = settings.nvidia_api_key
        if not api_key:
            raise ValueError("NVIDIA_API_KEY not found in environment variables")
        
        # Initialize NVIDIA models
        self.llm = NVIDIA(model="meta/llama-3.2-3b-instruct", api_key=api_key)
        self.embed_model = NVIDIAEmbedding(
            model="nvidia/nv-embedqa-e5-v5",
            truncate="END",
            api_key=api_key
        )
        
        Settings.llm = self.llm
        Settings.embed_model = self.embed_model
        print("[OK] NVIDIA models initialized for Sheet RAG")
    
    def _setup_vector_stores(self):
        """Initialize ChromaDB with separate collection for each layer"""
        persist_dir = os.path.join(settings.chroma_persist_dir, "sheet_rag")
        os.makedirs(persist_dir, exist_ok=True)
        
        # Initialize Chroma client
        self.chroma_client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Create/get collection for each layer
        for layer in self.LAYERS:
            collection_name = f"{self.COLLECTION_PREFIX}_{layer}"
            try:
                self.collections[layer] = self.chroma_client.get_collection(collection_name)
                print(f"[OK] Loaded {layer} collection with {self.collections[layer].count()} chunks")
            except:
                self.collections[layer] = self.chroma_client.create_collection(
                    name=collection_name,
                    metadata={"description": f"Sheet RAG {layer} layer"}
                )
                print(f"[OK] Created new {layer} collection")
            
            # Create LlamaIndex vector store wrapper
            self.vector_stores[layer] = ChromaVectorStore(
                chroma_collection=self.collections[layer]
            )
    
    def _load_or_create_indexes(self):
        """Load existing indexes or create new ones for each layer"""
        for layer in self.LAYERS:
            storage_context = StorageContext.from_defaults(
                vector_store=self.vector_stores[layer]
            )
            
            if self.collections[layer].count() > 0:
                self.indexes[layer] = VectorStoreIndex.from_vector_store(
                    self.vector_stores[layer],
                    storage_context=storage_context
                )
            else:
                self.indexes[layer] = VectorStoreIndex.from_documents(
                    [],
                    storage_context=storage_context
                )
    
    def add_documents(self, documents: List[Document]):
        """
        Add documents to all layers with hierarchical chunking.
        
        Args:
            documents: List of LlamaIndex Documents to ingest
        """
        print(f"📄 Adding {len(documents)} documents to Sheet RAG...")
        
        # Chunk documents at all levels
        chunks_by_level = create_hierarchical_chunks(documents)
        
        # Map of layer name to chunks key
        layer_to_key = {
            "sentence": "sentences",
            "paragraph": "paragraphs",
            "section": "sections",
            "summary": "summaries"
        }
        
        # Add chunks to each layer's index
        for layer in self.LAYERS:
            key = layer_to_key[layer]
            layer_docs = chunks_by_level.get(key, [])
            
            if not layer_docs:
                print(f"  ⚠️ No {layer} chunks generated")
                continue
            
            print(f"  📊 Adding {len(layer_docs)} chunks to {layer} layer...")
            
            storage_context = StorageContext.from_defaults(
                vector_store=self.vector_stores[layer]
            )
            
            if self.indexes[layer] is None or self.collections[layer].count() == 0:
                # Create new index with documents
                self.indexes[layer] = VectorStoreIndex.from_documents(
                    layer_docs,
                    storage_context=storage_context,
                    show_progress=True
                )
            else:
                # Insert into existing index
                for doc in layer_docs:
                    self.indexes[layer].insert(doc)
        
        stats = self.get_stats()
        print(f"[OK] Sheet RAG ingestion complete. Total chunks: {stats['total_chunks']}")
    
    def _search_layer(
        self,
        layer: str,
        query_text: str,
        top_k: int = 5
    ) -> List[ScoredChunk]:
        """Search a single layer and return scored chunks"""
        if self.indexes[layer] is None or self.collections[layer].count() == 0:
            return []
        
        retriever = self.indexes[layer].as_retriever(similarity_top_k=top_k)
        nodes = retriever.retrieve(query_text)
        
        return create_scored_chunks_from_nodes(nodes, layer)
    
    def _static_rerank_penalty(self, chunk: ScoredChunk) -> float:
        """
        Penalize chunks that often rank highly for broad queries but rarely answer them:
        preprint boilerplate, reference lists, bibliography-style sections.
        """
        if not getattr(settings, "sheet_rag_boilerplate_penalty_enabled", True):
            return 0.0
        if is_boilerplate(chunk.text or "", chunk.metadata):
            return max(0.45, float(getattr(settings, "sheet_rag_boilerplate_penalty", 0.22)))
        return 0.0

    def _rerank_validated_for_query(
        self,
        validated: List[ValidatedResult],
    ) -> Tuple[List[ValidatedResult], Dict[str, Any]]:
        """
        Re-rank cross-validated hits by query relevance (primary retrieval score)
        and validation confidence. Pure confidence ordering can surface bibliography
        or boilerplate that agrees across layers but does not match the question.
        """
        if not validated:
            return [], {}
        wr = float(getattr(settings, "sheet_rag_rerank_retrieval_weight", 0.72))
        wc = float(getattr(settings, "sheet_rag_rerank_confidence_weight", 0.28))
        s = wr + wc
        if s <= 0:
            wr, wc = 0.72, 0.28
        else:
            wr, wc = wr / s, wc / s
        min_rs = float(getattr(settings, "sheet_rag_min_primary_retrieval_score", 0.0))
        pool = (
            [r for r in validated if r.primary_chunk.score >= min_rs]
            if min_rs > 0
            else list(validated)
        )
        filter_exhausted = bool(min_rs > 0 and not pool)
        if not pool:
            pool = list(validated)

        mode = (getattr(settings, "sheet_rag_context_ranking", None) or "query_first").strip().lower()
        if mode not in ("query_first", "weighted_blend"):
            mode = "query_first"

        def penalty(r: ValidatedResult) -> float:
            return self._static_rerank_penalty(r.primary_chunk)

        def combined_weighted(r: ValidatedResult) -> float:
            pen = penalty(r)
            return (
                wr * float(r.primary_chunk.score)
                + wc * float(r.confidence_score)
                - pen
            )

        def query_adjusted_score(r: ValidatedResult) -> float:
            return float(r.primary_chunk.score) - penalty(r)

        if mode == "weighted_blend":
            ranked = sorted(pool, key=combined_weighted, reverse=True)
            method_label = "retrieval_confidence_weighted_sum_minus_penalties"
        else:
            ranked = sorted(
                pool,
                key=lambda r: (query_adjusted_score(r), float(r.confidence_score)),
                reverse=True,
            )
            method_label = "query_first_retrieval_minus_penalties_then_confidence"

        meta = {
            "context_ranking": mode,
            "method": method_label,
            "retrieval_weight": wr,
            "confidence_weight": wc,
            "min_primary_retrieval_score": min_rs,
            "filter_exhausted_fell_back_to_all": filter_exhausted,
            "boilerplate_penalty_enabled": getattr(
                settings, "sheet_rag_boilerplate_penalty_enabled", True
            ),
            "max_chunks_per_paper": int(
                getattr(settings, "sheet_rag_max_chunks_per_paper", 2)
            ),
            "rank_preview": [
                {
                    "chunk_id": r.primary_chunk.chunk_id,
                    "level": r.primary_chunk.level,
                    "file_name": (r.primary_chunk.metadata or {}).get("file_name"),
                    "retrieval_score": float(r.primary_chunk.score),
                    "confidence": float(r.confidence_score),
                    "penalty": penalty(r),
                    "query_adjusted_retrieval": query_adjusted_score(r),
                    "combined_weighted": combined_weighted(r),
                }
                for r in ranked[:12]
            ],
        }
        return ranked, meta

    def _select_diverse_context_chunks(
        self,
        validated_ordered: List[ValidatedResult],
        top_k: int,
    ) -> List[ScoredChunk]:
        """
        Walk re-ranked validated results and take primaries until top_k,
        enforcing a per-PDF cap so one boilerplate-heavy paper cannot fill the window.
        """
        max_per = int(getattr(settings, "sheet_rag_max_chunks_per_paper", 2))
        if max_per <= 0 or top_k <= 0:
            return [r.primary_chunk for r in validated_ordered[:top_k]]
        by_file: Dict[str, int] = defaultdict(int)
        out: List[ScoredChunk] = []
        seen_ids: set = set()
        for r in validated_ordered:
            pid = r.primary_chunk.chunk_id
            if pid in seen_ids:
                continue
            fn = (r.primary_chunk.metadata or {}).get("file_name") or ""
            if by_file[fn] >= max_per:
                continue
            out.append(r.primary_chunk)
            seen_ids.add(pid)
            by_file[fn] += 1
            if len(out) >= top_k:
                return out
        for r in validated_ordered:
            pid = r.primary_chunk.chunk_id
            if pid in seen_ids:
                continue
            out.append(r.primary_chunk)
            seen_ids.add(pid)
            if len(out) >= top_k:
                break
        return out

    def _fill_from_paragraph_query_order(
        self,
        layer_results: Dict[str, List[ScoredChunk]],
        already: List[ScoredChunk],
        need: int,
    ) -> List[ScoredChunk]:
        """Add paragraphs in strict query-retrieval order (minus penalties) up to `need` chunks."""
        if need <= 0:
            return []
        seen = {c.chunk_id for c in already}
        paras = list(layer_results.get("paragraph") or [])
        paras.sort(
            key=lambda c: float(c.score) - self._static_rerank_penalty(c),
            reverse=True,
        )
        extra: List[ScoredChunk] = []
        for c in paras:
            if c.chunk_id in seen:
                continue
            seen.add(c.chunk_id)
            extra.append(c)
            if len(extra) >= need:
                break
        return extra
    
    def query(
        self,
        query_text: str,
        top_k: int = 5,
        use_cross_validation: bool = True
    ) -> Dict[str, Any]:
        """
        Query all layers and optionally cross-validate results.
        
        Args:
            query_text: The user's query
            top_k: Number of results per layer
            use_cross_validation: Whether to filter with cross-validation
            
        Returns:
            Dict containing response, sources, and validation metadata
        """
        # Check if any layer has data
        total_chunks = sum(self.collections[layer].count() for layer in self.LAYERS)
        if total_chunks == 0:
            empty = {
                "response": "The Sheet RAG index is empty. Please ingest some papers first.",
                "sources": [],
                "validation": None
            }
            log_sheet_rag_query(
                query_text=query_text,
                top_k=top_k,
                use_cross_validation=use_cross_validation,
                cache_hit=False,
                context_chunks_for_generation=None,
                validated_results=None,
                result=empty,
            )
            return empty
        
        # Check cache (include re-rank settings so ordering stays consistent with config)
        _rw = float(getattr(settings, "sheet_rag_rerank_retrieval_weight", 0.72))
        _cw = float(getattr(settings, "sheet_rag_rerank_confidence_weight", 0.28))
        _minr = float(getattr(settings, "sheet_rag_min_primary_retrieval_score", 0.0))
        _mfp = int(getattr(settings, "sheet_rag_max_chunks_per_paper", 2))
        _bpen = 1 if getattr(settings, "sheet_rag_boilerplate_penalty_enabled", True) else 0
        _pm = int(getattr(settings, "sheet_rag_retrieval_pool_multiplier", 4))
        _cr = (getattr(settings, "sheet_rag_context_ranking", None) or "query_first").strip().lower()
        _cfs = 1 if getattr(settings, "cross_validation_require_cross_file", True) else 0
        cache_key = (
            f"sheet_rag:{query_text}:{top_k}:{use_cross_validation}:"
            f"rr{_rw:.3f}_rc{_cw:.3f}_minr{_minr:.3f}_mfp{_mfp}_bp{_bpen}_pm{_pm}_cr{_cr}_cfs{_cfs}"
        )
        cached = self.cache.get_query_result(cache_key)
        if cached:
            print("[OK] Cache hit for Sheet RAG query")
            log_sheet_rag_query(
                query_text=query_text,
                top_k=top_k,
                use_cross_validation=use_cross_validation,
                cache_hit=True,
                context_chunks_for_generation=None,
                validated_results=None,
                result=cached,
            )
            return cached
        
        print(f"[SEARCH] Querying all {len(self.LAYERS)} layers...")
        
        mult = max(1, int(getattr(settings, "sheet_rag_retrieval_pool_multiplier", 4)))
        cap = max(top_k, int(getattr(settings, "sheet_rag_retrieval_pool_max", 40)))
        search_k = min(cap, max(top_k, top_k * mult))

        # Search all layers (wide pool so chunks ranked ~6–20 for the query can still compete)
        layer_results: Dict[str, List[ScoredChunk]] = {}
        for layer in self.LAYERS:
            layer_results[layer] = self._search_layer(layer, query_text, search_k)
            print(f"  [STATS] {layer}: {len(layer_results[layer])} results (pool_k={search_k})")
        
        # Cross-validate if enabled
        if use_cross_validation:
            validated_results = self.validator.validate_bidirectional(layer_results)
            rerank_meta: Dict[str, Any] = {}
            if validated_results:
                validated_results, rerank_meta = self._rerank_validated_for_query(
                    validated_results
                )
            validation_summary = self.validator.get_validation_summary(validated_results)
            if rerank_meta:
                validation_summary["rerank"] = rerank_meta
            
            print(f"[OK] Cross-validation: {len(validated_results)} validated results")
            
            # Use validated results for response generation
            if validated_results:
                context_chunks = self._select_diverse_context_chunks(
                    validated_results, top_k
                )
                if len(context_chunks) < top_k:
                    fill = self._fill_from_paragraph_query_order(
                        layer_results,
                        context_chunks,
                        top_k - len(context_chunks),
                    )
                    if fill:
                        context_chunks = context_chunks + fill
                        validation_summary["paragraph_gap_fill"] = len(fill)
            else:
                # Fallback to unvalidated results if nothing passes validation
                context_chunks = self._fill_from_paragraph_query_order(
                    layer_results, [], top_k
                )
                validation_summary["fallback_used"] = True
        else:
            # No validation — still order strictly by query retrieval score (minus penalties)
            paras = list(layer_results.get("paragraph") or [])
            paras.sort(
                key=lambda c: float(c.score) - self._static_rerank_penalty(c),
                reverse=True,
            )
            context_chunks = paras[:top_k]
            validated_results = []
            validation_summary = {"validation_disabled": True}

        validation_summary["retrieval_pool_per_layer"] = search_k
        
        # Generate response using LLM
        response = self._generate_response(query_text, context_chunks)
        
        # Format sources
        sources = self._format_sources(
            context_chunks,
            validated_results if use_cross_validation else None
        )
        
        result = {
            "response": response,
            "sources": sources,
            "validation": validation_summary,
            "layers_searched": {
                layer: len(chunks) for layer, chunks in layer_results.items()
            }
        }

        log_sheet_rag_query(
            query_text=query_text,
            top_k=top_k,
            use_cross_validation=use_cross_validation,
            cache_hit=False,
            context_chunks_for_generation=context_chunks,
            validated_results=validated_results if use_cross_validation else [],
            result=result,
        )
        
        # Cache result
        self.cache.set_query_result(cache_key, result)
        
        return result
    
    def _generate_response(
        self,
        query_text: str,
        context_chunks: List[ScoredChunk]
    ) -> str:
        """Generate response using LLM with context from validated chunks"""
        if not context_chunks:
            return "I couldn't find relevant information to answer your question with sufficient confidence."
        
        # Build context string
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            context_parts.append(f"[Source {i} - {chunk.level}]\n{chunk.text}")
        
        context = "\n\n".join(context_parts)
        
        prompt = f"""Based on the following validated research paper excerpts, provide a **detailed and comprehensive** answer to the question.
        
Instructions:
1. **Be Detailed**: Do not give short summaries. Explain concepts in depth using the provided context.
2. **Cite Sources**: When using information from a specific source, cite it using its ID (e.g., "[Source 1]", "[Source 2]").
3. **No Hallucinations**: Only use information that appears in the provided context. If the context doesn't contain enough information to fully answer the question, say so clearly.
4. **Admit Uncertainty**: If different sources contradict each other or if the answer is unclear, explain the ambiguity.

Context:
{context}

Question: {query_text}

Detailed Answer:"""
        
        debug_llm = settings.debug_llm_log
        start = time.time()
        if debug_llm:
            timestamp = datetime.utcnow().isoformat() + "Z"
            prompt_preview = prompt[:1200].replace("\n", " ")
            print(
                "[LLM][START]"
                f" ts={timestamp}"
                f" query_len={len(query_text)}"
                f" context_chunks={len(context_chunks)}"
                f" context_len={len(context)}"
                f" prompt_len={len(prompt)}"
                f" prompt_preview=\"{prompt_preview}\""
            )

        try:
            response = self.llm.complete(prompt)
            elapsed = time.time() - start
            if debug_llm:
                timestamp = datetime.utcnow().isoformat() + "Z"
                print(
                    "[LLM][END]"
                    f" ts={timestamp}"
                    f" elapsed_s={elapsed:.2f}"
                )
            return str(response).strip()
        except Exception as e:
            elapsed = time.time() - start
            if debug_llm:
                timestamp = datetime.utcnow().isoformat() + "Z"
                print(
                    "[LLM][ERROR]"
                    f" ts={timestamp}"
                    f" elapsed_s={elapsed:.2f}"
                    f" error=\"{e}\""
                )
            return f"Error generating response: {str(e)}"
    
    def _format_sources(
        self,
        chunks: List[ScoredChunk],
        validated_results: Optional[List[ValidatedResult]] = None
    ) -> List[Dict[str, Any]]:
        """Format source chunks for API response"""
        sources = []
        
        # Create a map of chunk_id to validation info
        validation_map = {}
        if validated_results:
            for result in validated_results:
                validation_map[result.primary_chunk.chunk_id] = {
                    "confidence": result.confidence_score,
                    "layer_coverage": result.layer_coverage,
                    "supporting_layers": list(result.supporting_chunks.keys())
                }
        
        # Deduplicate chunks based on text similarity or parent/child relationships
        seen_texts = set()
        unique_sources = []
        
        for chunk in chunks:
            # Skip if very similar text already exists (simple deduplication)
            # For better dedupe, we could check if one chunk is contained in another
            is_duplicate = False
            for seen in seen_texts:
                # Check for significant overlap or containment
                if chunk.text in seen or seen in chunk.text:
                    is_duplicate = True
                    break
                # Check fuzzy overlap (start/end)
                if len(chunk.text) > 50 and chunk.text[:50] in seen:
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
                
            seen_texts.add(chunk.text)
            
            # Build metadata including level for UI
            metadata = {
                k: v for k, v in chunk.metadata.items()
                if k not in ["chunk_id", "parent_id"]
            }
            metadata["level"] = chunk.level  # Ensure level is in metadata
            
            source = {
                "text": chunk.text[:500] + ("..." if len(chunk.text) > 500 else ""),
                "level": chunk.level,
                "score": chunk.score,
                "chunk_id": chunk.chunk_id,
                "metadata": metadata
            }
            
            # Add validation info if available
            if chunk.chunk_id in validation_map:
                source["validation"] = validation_map[chunk.chunk_id]
            
            unique_sources.append(source)
            
        return unique_sources
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics for all layers"""
        stats = {
            "layers": {},
            "total_chunks": 0
        }
        
        for layer in self.LAYERS:
            count = self.collections[layer].count()
            stats["layers"][layer] = {
                "chunk_count": count,
                "collection_name": f"{self.COLLECTION_PREFIX}_{layer}"
            }
            stats["total_chunks"] += count
        
        stats["persist_dir"] = os.path.join(settings.chroma_persist_dir, "sheet_rag")
        
        return stats
    
    def clear_all(self):
        """Clear all data from all layers"""
        for layer in self.LAYERS:
            collection_name = f"{self.COLLECTION_PREFIX}_{layer}"
            try:
                self.chroma_client.delete_collection(collection_name)
                print(f"[OK] Deleted {layer} collection")
            except:
                pass
        
        # Reinitialize
        self._setup_vector_stores()
        self._load_or_create_indexes()
        print("[OK] Sheet RAG cleared and reinitialized")
    
    def clear_layer(self, layer: str):
        """Clear a specific layer"""
        if layer not in self.LAYERS:
            raise ValueError(f"Unknown layer: {layer}. Valid: {self.LAYERS}")
        
        collection_name = f"{self.COLLECTION_PREFIX}_{layer}"
        try:
            self.chroma_client.delete_collection(collection_name)
            print(f"[OK] Deleted {layer} collection")
            
            # Recreate empty collection
            self.collections[layer] = self.chroma_client.create_collection(
                name=collection_name,
                metadata={"description": f"Sheet RAG {layer} layer"}
            )
            self.vector_stores[layer] = ChromaVectorStore(
                chroma_collection=self.collections[layer]
            )
            self.indexes[layer] = VectorStoreIndex.from_documents(
                [],
                storage_context=StorageContext.from_defaults(
                    vector_store=self.vector_stores[layer]
                )
            )
        except Exception as e:
            print(f"Error clearing {layer}: {e}")
