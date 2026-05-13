import argparse
import logging
from typing import List

from tqdm import tqdm
from llama_index.core import StorageContext, VectorStoreIndex

from ingestion import download_paper, load_documents, search_papers
from sheet_rag_engine import SheetRAGEngine
from papers_library import papers_library
from hierarchical_chunker import create_hierarchical_chunks


def _load_ids_from_file(path: str) -> List[str]:
    ids = []
    with open(path, "r") as handle:
        for line in handle:
            arxiv_id = line.strip()
            if arxiv_id:
                ids.append(arxiv_id)
    return ids


def _resolve_ids(args: argparse.Namespace) -> List[str]:
    if args.ids_file:
        return _load_ids_from_file(args.ids_file)
    if args.arxiv_ids:
        return args.arxiv_ids
    return []


def ingest_with_progress(arxiv_ids: List[str]) -> None:
    if not arxiv_ids:
        raise ValueError("No arXiv IDs provided.")

    # Quiet noisy HTTP logs that break tqdm rendering.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    engine = SheetRAGEngine()
    embed_model_name = getattr(engine.embed_model, "model", "nvidia/nv-embedqa-e5-v5")

    print("Embedding model:", embed_model_name)
    print("Papers to ingest:")
    for arxiv_id in arxiv_ids:
        print("-", arxiv_id)

    layer_to_key = {
        "sentence": "sentences",
        "paragraph": "paragraphs",
        "section": "sections",
        "summary": "summaries",
    }

    for arxiv_id in arxiv_ids:
        metadata = None
        try:
            search_results = search_papers(arxiv_id, max_results=1)
            metadata = search_results[0] if search_results else None
        except Exception:
            metadata = None

        title = metadata.get("title", "Unknown") if metadata else "Unknown"
        print("\nIngesting:", arxiv_id)
        print("Title:", title)

        file_path = download_paper(arxiv_id)
        documents = load_documents(file_path)

        chunks_by_level = create_hierarchical_chunks(documents)

        for layer in engine.LAYERS:
            key = layer_to_key[layer]
            layer_docs = chunks_by_level.get(key, [])
            print(f"Layer: {layer} | Chunks: {len(layer_docs)} | Embedding: {embed_model_name}")

            if not layer_docs:
                continue

            storage_context = StorageContext.from_defaults(
                vector_store=engine.vector_stores[layer]
            )

            if engine.indexes[layer] is None or engine.collections[layer].count() == 0:
                engine.indexes[layer] = VectorStoreIndex.from_documents(
                    [],
                    storage_context=storage_context,
                )

            for doc in tqdm(
                layer_docs,
                desc=f"{arxiv_id} [{layer}]",
                unit="chunk",
                leave=True,
            ):
                engine.indexes[layer].insert(doc)

        if metadata:
            papers_library.add_paper(
                arxiv_id=arxiv_id,
                title=metadata.get("title", "Unknown"),
                authors=metadata.get("authors", []),
                summary=metadata.get("summary", ""),
                pages=len(documents),
            )

    stats = engine.get_stats()
    print("\nDone. Sheet RAG stats:")
    print(stats)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest arXiv papers with tqdm progress per layer."
    )
    parser.add_argument(
        "--arxiv-ids",
        nargs="*",
        help="Space-separated list of arXiv IDs to ingest.",
    )
    parser.add_argument(
        "--ids-file",
        help="Path to a file with one arXiv ID per line.",
    )

    args = parser.parse_args()
    arxiv_ids = _resolve_ids(args)

    if not arxiv_ids:
        raise SystemExit(
            "Provide --arxiv-ids or --ids-file to ingest papers with progress."
        )

    ingest_with_progress(arxiv_ids)


if __name__ == "__main__":
    main()
