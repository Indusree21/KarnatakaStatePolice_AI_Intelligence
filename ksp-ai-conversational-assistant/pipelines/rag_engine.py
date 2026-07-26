"""
pipelines/rag_engine.py — RAG pipeline using Groq (free, no billing).
Model: llama-3.3-70b-versatile via Groq API
"""
from __future__ import annotations

import io
import os
from typing import Any, Dict, List, Tuple

from dotenv import load_dotenv
from groq import Groq
from pypdf import PdfReader

from pipelines.vector_store import index_pdf_chunks, similarity_search

load_dotenv()

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        key = os.getenv("GROQ_API_KEY", "")
        if not key:
            raise ValueError("GROQ_API_KEY not set in environment")
        _client = Groq(api_key=key)
    return _client


def _generate(system: str, user: str, max_tokens: int = 700) -> str:
    resp = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.1,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()


_CHUNK_SIZE    = 400
_CHUNK_OVERLAP = 80

_SYSTEM_RAG = (
    "You are a senior crime analyst assistant for the Karnataka State Police. "
    "Answer the officer's question using ONLY the provided context snippets. "
    "If the context does not contain enough information, say so clearly. "
    "Always mention specific case IDs, crime numbers, and police stations when available. "
    "Do not invent facts."
)


def _chunk_text(text: str) -> List[str]:
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start:start + _CHUNK_SIZE])
        start += _CHUNK_SIZE - _CHUNK_OVERLAP
    return [c for c in chunks if len(c.strip()) > 50]


def ingest_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    chunks = _chunk_text(full_text)
    count = index_pdf_chunks(chunks, source_filename=filename)
    return {
        "filename": filename,
        "pages": len(reader.pages),
        "chunks_indexed": count,
        "total_chars": len(full_text),
    }


def _format_context(hits: List[Dict[str, Any]]) -> Tuple[str, List[str]]:
    context_parts, citations = [], []
    for i, hit in enumerate(hits, 1):
        meta = hit["metadata"]
        src  = meta.get("source_type", "unknown")
        label = (
            f"CaseMaster ID #{meta.get('CaseMasterID','?')}, CrimeNo: {meta.get('CrimeNo','?')}"
            if src == "brief_facts"
            else f"PDF: {meta.get('filename','?')} (chunk {meta.get('chunk_index','?')})"
        )
        context_parts.append(f"[{i}] Source: {label}\n{hit['document']}")
        citations.append(label)
    return "\n\n".join(context_parts), citations


def rag_query(question: str, role: str = "INSPECTOR", n_results: int = 5) -> Dict[str, Any]:
    hits = similarity_search(question, n_results=n_results, role=role)

    if not hits:
        return {
            "answer_text": (
                "No relevant case documents found in the knowledge base. "
                "Please ensure the vector index has been populated."
            ),
            "citations": [],
            "retrieved_chunks": [],
        }

    context, citations = _format_context(hits)
    user_msg = (
        f"Context:\n{context}\n\n"
        f"Officer's question: {question}\n\n"
        "Provide a precise answer referencing the source case IDs or PDF names."
    )

    answer = _generate(_SYSTEM_RAG, user_msg)

    return {
        "answer_text": answer,
        "citations": citations,
        "retrieved_chunks": [
            {"text": h["document"][:200] + "...", "metadata": h["metadata"]}
            for h in hits
        ],
    }
