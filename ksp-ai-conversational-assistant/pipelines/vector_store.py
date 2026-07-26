"""
pipelines/vector_store.py — ChromaDB collection management.

Indexes:
  - BriefFacts from CaseMaster (one document per case)
  - Uploaded PDF investigative summaries (chunked by paragraph)
"""
from __future__ import annotations

import os
import uuid
from typing import List, Dict, Any

import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

load_dotenv()

_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
_COLLECTION_NAME = "ksp_cases"

# Use the built-in sentence-transformers embedder (no API key required)
_EMBEDDING_FN = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None


def _get_collection() -> chromadb.Collection:
    """Lazily initialise the ChromaDB client and collection."""
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=_PERSIST_DIR)
        _collection = _client.get_or_create_collection(
            name=_COLLECTION_NAME,
            embedding_function=_EMBEDDING_FN,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def index_brief_facts(cases: List[Dict[str, Any]]) -> int:
    """
    Upsert BriefFacts texts from CaseMaster rows into ChromaDB.

    Each `case` dict must contain at least:
      CaseMasterID, CrimeNo, BriefFacts, and optionally PoliceStationID.
    Returns the number of documents upserted.
    """
    col = _get_collection()
    ids, docs, metas = [], [], []

    for case in cases:
        brief = (case.get("BriefFacts") or "").strip()
        if not brief:
            continue
        doc_id = f"case_{case['CaseMasterID']}"
        ids.append(doc_id)
        docs.append(brief)
        metas.append({
            "source_type": "brief_facts",
            "CaseMasterID": str(case["CaseMasterID"]),
            "CrimeNo": case.get("CrimeNo", ""),
            "PoliceStationID": str(case.get("PoliceStationID", "")),
            "IsConfidential": str(case.get("IsConfidential", 0)),
        })

    if ids:
        col.upsert(ids=ids, documents=docs, metadatas=metas)
    return len(ids)


def index_pdf_chunks(
    chunks: List[str],
    source_filename: str,
    extra_meta: Dict[str, Any] | None = None,
) -> int:
    """
    Upsert text chunks from a parsed PDF into ChromaDB.
    Returns number of chunks indexed.
    """
    col = _get_collection()
    if not chunks:
        return 0

    ids, docs, metas = [], [], []
    for i, chunk in enumerate(chunks):
        chunk = chunk.strip()
        if not chunk:
            continue
        doc_id = f"pdf_{uuid.uuid5(uuid.NAMESPACE_URL, source_filename + str(i))}"
        ids.append(str(doc_id))
        docs.append(chunk)
        meta = {
            "source_type": "pdf",
            "filename": source_filename,
            "chunk_index": str(i),
        }
        if extra_meta:
            meta.update({k: str(v) for k, v in extra_meta.items()})
        metas.append(meta)

    col.upsert(ids=ids, documents=docs, metadatas=metas)
    return len(ids)


def similarity_search(
    query: str,
    n_results: int = 5,
    role: str = "INSPECTOR",
) -> List[Dict[str, Any]]:
    """
    Retrieve the top-n semantically similar documents.
    CONSTABLEs are filtered to exclude confidential records.
    Returns a list of dicts: {document, metadata, distance}.
    """
    col = _get_collection()

    where_filter: Dict | None = None
    if role.upper() == "CONSTABLE":
        where_filter = {"IsConfidential": {"$eq": "0"}}

    results = col.query(
        query_texts=[query],
        n_results=n_results,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    docs_list = results.get("documents", [[]])[0]
    meta_list = results.get("metadatas", [[]])[0]
    dist_list = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(docs_list, meta_list, dist_list):
        hits.append({"document": doc, "metadata": meta, "distance": round(dist, 4)})

    return hits


def rebuild_index_from_db() -> int:
    """
    Pull all BriefFacts from the live SQLite DB and rebuild the vector index.
    Call this on startup or after bulk data changes.
    """
    from db.database import run_query

    rows = run_query(
        "SELECT CaseMasterID, CrimeNo, BriefFacts, PoliceStationID, IsConfidential FROM CaseMaster"
    )
    return index_brief_facts(rows)
