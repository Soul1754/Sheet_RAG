"""
Reference stripping, citation/boilerplate heuristics, and chunk rejection
for academic PDF text pipelines.
"""

from __future__ import annotations

import os
import re
from typing import Dict, Optional

# Last heading wins: truncate everything from the final References / Bibliography block.
_REF_HEADING = re.compile(
    r"(?:^|\n)\s*(References|Bibliography)\s*(?:\n|$)",
    re.IGNORECASE | re.MULTILINE,
)

# Lines that look like bibliography / citation lines (not prose).
_CIT_LINE_CORE = re.compile(
    r"("
    r"\[\d{1,4}\]"  # [42]
    r"|^\s*\d{1,2}\.\s+[A-Z][a-zA-Z\-`']+(?:\s*,\s*[A-Z])?"  # 6. Fan, W. or 10. Chen, Z.
    r"|arxiv\.org/(?:abs|pdf)/\d{4}\.\d{4,5}"
    r"|doi\.org/10\.\d+"
    r"|\barXiv:\s*\d{4}\.\d{4,5}"
    r"|CoRR,\s*abs/\d{4}\.\d+"
    r"|(?:Springer|Proceedings of the|ACM SIGIR|OpenReview|Advances in Neural Information|"
    r"International Conference on Machine Learning|Findings of the Association)\b"
    r")",
    re.IGNORECASE | re.MULTILINE,
)


def strip_reference_suffix(text: str) -> str:
    """
    Drop the reference / bibliography tail using the last References or Bibliography
    heading in the document (common ACM / arXiv layout).
    """
    if not text or not text.strip():
        return text
    matches = list(_REF_HEADING.finditer(text))
    if not matches:
        return text
    cut = matches[-1].start()
    return text[:cut].rstrip()


def line_matches_citation_pattern(line: str) -> bool:
    s = line.strip()
    if len(s) < 10:
        return False
    if _CIT_LINE_CORE.search(s):
        return True
    if re.match(r"^\[\d{1,4}\]", s):
        return True
    if re.match(r"^\s*\d{1,2}\.\s+[A-Z]", s) and (
        "arXiv" in s or "doi" in s.lower() or "http" in s.lower() or "abs/" in s
    ):
        return True
    return False


def citation_line_ratio(text: str) -> float:
    lines = [ln for ln in text.splitlines() if len(ln.strip()) > 8]
    if not lines:
        return 0.0
    hits = sum(1 for ln in lines if line_matches_citation_pattern(ln))
    return hits / len(lines)


def should_reject_chunk_for_indexing(text: str, threshold: float = 0.35) -> bool:
    """True → do not embed this chunk (too citation-dense to be useful prose)."""
    if not text or len(text.strip()) < 40:
        return False
    return citation_line_ratio(text) > threshold


def _source_meta(meta: Optional[Dict[str, Any]]) -> str:
    m = meta or {}
    fn = m.get("file_name") or ""
    if fn:
        return os.path.basename(str(fn))
    fp = m.get("file_path") or ""
    return os.path.basename(str(fp)) if fp else ""


def is_boilerplate(text: str, meta: Optional[Dict[str, Any]] = None) -> bool:
    """
    Heuristic boilerplate / reference-block detector for reranking penalties.
    Stricter than should_reject_chunk_for_indexing on some short patterns.
    """
    if not text:
        return False
    low = text.lower()
    if "this preprint has not undergone peer review" in low:
        return True
    if "version of record" in low and "peer review" in low:
        return True
    head = low[:260]
    if "peer review" in head and ("preprint" in head or "submission" in head):
        return True
    section = (
        (meta.get("section_title") or "") + " " + (meta.get("parent_section") or "")
        if meta
        else ""
    ).lower()
    if any(
        k in section
        for k in (
            "preprint acknowledgment",
            "references",
            "bibliography",
            "acknowledgment",
            "acknowledgement",
        )
    ):
        return True
    if re.search(r"arxiv\.org/(?:abs|pdf)/\d{4}\.\d{4,5}", low) and len(text) < 1200:
        return True
    if len(re.findall(r"\[\d{1,4}\]", text)) >= 5:
        return True
    if re.search(r"^\s*\d{1,2}\.\s+[A-Z][a-z\-]+,\s+[A-Z]", text, re.MULTILINE):
        n_bib = len(
            re.findall(
                r"^\s*\d{1,2}\.\s+[A-Z][a-zA-Z\-`']",
                text,
                re.MULTILINE,
            )
        )
        if n_bib >= 4:
            return True
    if citation_line_ratio(text) >= 0.28:
        return True
    return False
