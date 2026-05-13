from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # NVIDIA API
    nvidia_api_key: str
    
    # Vector Database
    chroma_persist_dir: str = "./chroma_db"
    
    # Redis Cache
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = False
    
    # Server
    host: str = "127.0.0.1"
    port: int = 8002
    
    # Performance
    batch_size: int = 32
    max_workers: int = 4
    
    # Sheet RAG Settings
    sheet_rag_enabled: bool = True
    sheet_rag_layers: list = ["sentence", "paragraph", "section", "summary"]
    cross_validation_threshold: float = 0.5
    cross_validation_min_layers: int = 2
    # Supporting evidence must come from a different PDF than the primary (no same-doc circularity).
    cross_validation_require_cross_file: bool = True
    # After cross-validation: rank by blend of query similarity (primary retrieval) and confidence.
    # Defaults favor retrieval because scores are often tightly clustered (~0.55–0.65).
    sheet_rag_rerank_retrieval_weight: float = 0.72
    sheet_rag_rerank_confidence_weight: float = 0.28
    # Drop validated primaries below this retrieval score before re-ranking (0 = disabled).
    # If all are filtered out, the full list is used again.
    sheet_rag_min_primary_retrieval_score: float = 0.0
    # Down-rank boilerplate (preprint disclaimers) and dense reference blocks in the rerank score.
    sheet_rag_boilerplate_penalty_enabled: bool = True
    sheet_rag_boilerplate_penalty: float = 0.22
    sheet_rag_reference_block_penalty: float = 0.16
    # Cap how many chosen context chunks may come from the same PDF (0 = no cap).
    sheet_rag_max_chunks_per_paper: int = 2
    # Each layer retrieves up to max(top_k, top_k * multiplier), capped (wider pool → more query-relevant candidates).
    sheet_rag_retrieval_pool_multiplier: int = 4
    sheet_rag_retrieval_pool_max: int = 40
    # How to order validated chunks for the LLM window:
    # - query_first: primary sort = retrieval score to the query (minus penalties), then confidence.
    # - weighted_blend: previous behavior (retrieval/confidence weights + penalties).
    sheet_rag_context_ranking: str = "query_first"

    # PDF text extraction: PyMuPDF (fitz) reads multi-column PDFs more reliably than pypdf.
    use_pymupdf_for_pdf: bool = True
    # Reject chunks whose lines are mostly citation-style before indexing (0–1).
    chunk_citation_reject_ratio: float = 0.35

    # Debug flags
    debug_llm_log: bool = True

    # RAG pipeline audit log (query, full chunks, response, scores)
    rag_pipeline_logging_enabled: bool = True
    rag_pipeline_log_dir: Optional[str] = None  # default: backend/logs
    rag_pipeline_log_file: Optional[str] = None  # default: rag_pipeline.log in log dir
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
