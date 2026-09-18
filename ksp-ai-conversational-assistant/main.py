"""
main.py — FastAPI application for the KSP Intelligent Conversational AI system.

Single endpoint: POST /api/chat
Intent routing: RBAC -> Router -> (SQL | RAG | Graph) -> JSON response
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

# ---------------------------------------------------------------------------
# Startup: build / refresh the vector index from the live DB
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from pipelines.vector_store import rebuild_index_from_db
        count = rebuild_index_from_db()
        print(f"[startup] Vector index built: {count} BriefFacts documents indexed.")
    except Exception as exc:
        print(f"[startup] Vector index skipped (DB may not be initialised yet): {exc}")
    yield


app = FastAPI(
    title="KSP Intelligent Conversational AI",
    version="1.0.0",
    description="Karnataka State Police — Datathon 2026 Track 1 Backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "OFFICER_101"})
    role: Literal["CONSTABLE", "INSPECTOR"] = Field(..., json_schema_extra={"example": "INSPECTOR"})
    language: Literal["en", "kn"] = Field(default="en")
    query: str = Field(..., min_length=3, json_schema_extra={"example": "Show accused in house burglaries in Mysuru"})


class GraphData(BaseModel):
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []


class ChatResponse(BaseModel):
    status: Literal["success", "error"]
    query_type: Optional[Literal["text_to_sql", "rag", "graph"]] = None
    answer_text: str
    citations: List[str] = []
    graph_data: Optional[GraphData] = None
    debug: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Intent router — classifies query into sql / rag / graph
# ---------------------------------------------------------------------------
import re as _re

_SQL_KEYWORDS = [
    "count", "how many", "total", "list", "show", "find", "number of",
    "which", "where", "district", "status", "accused", "arrested",
    "registered", "between", "from", "all cases", "cases in",
]

_GRAPH_KEYWORDS = [
    "link", "network", "connected", "connection", "relation", "gang",
    "associate", "co-accused", "who else", "linked to", "criminal network",
    "graph", "node", "show network", "accused in", "who are involved",
    "involved in", "suspect", "suspects",
]

_RAG_KEYWORDS = [
    "what happened", "describe", "explain", "details", "brief", "summary",
    "tell me about", "report", "incident", "information about", "pdf",
    "document", "investigat",
]

# Patterns that always trigger graph regardless of other scores
_GRAPH_FORCE_PATTERNS = [
    r"\bnetwork\b",
    r"\bgang\b",
    r"\bco.?accused\b",
    r"criminal\s+(network|link|gang)",
    r"(show|view|display|get)\s+(the\s+)?(network|graph|links?)",
    r"who\s+(are\s+)?(the\s+)?(accused|suspects?|involved)",
    r"case\s*\d+\s*(network|graph|link|accused|suspect)",
    r"\d+\s*(network|graph|link|accused|suspect)",
]


def _classify_intent(query: str) -> Literal["text_to_sql", "rag", "graph"]:
    q = query.lower()

    # Force graph for strong patterns
    for pattern in _GRAPH_FORCE_PATTERNS:
        if _re.search(pattern, q):
            return "graph"

    graph_score = sum(1 for kw in _GRAPH_KEYWORDS if kw in q)
    rag_score   = sum(1 for kw in _RAG_KEYWORDS   if kw in q)
    sql_score   = sum(1 for kw in _SQL_KEYWORDS    if kw in q)

    if graph_score >= 2 or (graph_score > 0 and graph_score >= sql_score):
        return "graph"
    if rag_score > sql_score:
        return "rag"
    return "text_to_sql"


# ---------------------------------------------------------------------------
# Main chat endpoint
# ---------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Route the query through:
      1. RBAC check
      2. Intent classification
      3. Appropriate pipeline (SQL / RAG / Graph)
      4. Structured JSON response
    """
    from pipelines.security import check_access

    # Step 1 — RBAC
    decision = check_access(role=request.role, query=request.query)
    if not decision.allowed:
        return ChatResponse(
            status="error",
            answer_text=decision.reason,
            citations=[],
        )

    # Step 2 — Intent routing
    intent = _classify_intent(request.query)

    # Step 3 — Dispatch
    try:
        if intent == "graph":
            return await _handle_graph(request)
        elif intent == "rag":
            return await _handle_rag(request)
        else:
            return await _handle_sql(request)
    except Exception as exc:
        err_msg = str(exc)
        # Surface friendly messages for common errors
        if "api_key" in err_msg.lower() or "invalid" in err_msg.lower() or "401" in err_msg or "authentication" in err_msg.lower():
            friendly = (
                "⚠️ Groq API key is missing or invalid. "
                "Please set a valid GROQ_API_KEY in the .env file and restart the backend."
            )
        elif "quota" in err_msg.lower() or "429" in err_msg or "resource_exhausted" in err_msg.lower() or "rate_limit" in err_msg.lower():
            friendly = "⚠️ Groq rate limit hit. Please wait a moment and try again."
        else:
            friendly = f"⚠️ Backend error: {err_msg}"
        return ChatResponse(status="error", answer_text=friendly, citations=[])


async def _handle_sql(req: ChatRequest) -> ChatResponse:
    from pipelines.text_to_sql import text_to_sql

    result = text_to_sql(question=req.query, role=req.role)

    if result.get("error") == "RBAC_BLOCKED":
        return ChatResponse(
            status="error",
            answer_text=result["answer_text"],
            query_type="text_to_sql",
        )

    return ChatResponse(
        status="success",
        query_type="text_to_sql",
        answer_text=result["answer_text"],
        citations=result.get("citations", []),
        debug={"sql": result.get("sql"), "row_count": len(result.get("rows", []))},
    )


async def _handle_rag(req: ChatRequest) -> ChatResponse:
    from pipelines.rag_engine import rag_query

    result = rag_query(question=req.query, role=req.role, n_results=5)

    return ChatResponse(
        status="success",
        query_type="rag",
        answer_text=result["answer_text"],
        citations=result.get("citations", []),
    )


async def _handle_graph(req: ChatRequest) -> ChatResponse:
    from pipelines.graph_engine import build_graph

    graph = build_graph(query=req.query, role=req.role, include_co_accused=True)

    stats   = graph.get("stats", {})
    case_id = graph.get("case_id")
    error   = graph.get("error")

    if error:
        return ChatResponse(status="error", answer_text=f"⚠️ {error}", citations=[])

    if case_id:
        summary = (
            f"**Criminal network for Case #{case_id}** loaded.\n\n"
            f"- 🚔 **{stats.get('accused_count', 0)} accused** persons\n"
            f"- 👤 **{stats.get('victim_count', 0)} victims**\n"
            f"- 📁 **{stats.get('case_count', 0)} case nodes** "
            f"(including cross-case links)\n\n"
            f"Click the **Network tab** to explore the graph. "
            f"Click any node to view details."
        )
    else:
        summary = (
            f"**Criminal network** built: "
            f"{stats.get('accused_count', 0)} accused persons linked across "
            f"{stats.get('case_count', 0)} cases "
            f"({stats.get('total_edges', 0)} connections). "
            f"Click the **Network tab** to explore."
        )

    return ChatResponse(
        status="success",
        query_type="graph",
        answer_text=summary,
        citations=[n["label"].replace("\n", " ") for n in graph["nodes"] if n.get("type") == "case"][:10],
        graph_data=GraphData(nodes=graph["nodes"], edges=graph["edges"]),
    )


# ---------------------------------------------------------------------------
# PDF ingestion endpoint
# ---------------------------------------------------------------------------
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Accept a PDF investigative summary, parse and index it into ChromaDB.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    from pipelines.rag_engine import ingest_pdf

    content = await file.read()
    result = ingest_pdf(file_bytes=content, filename=file.filename)
    return {"status": "indexed", **result}


# ---------------------------------------------------------------------------
# Active case map endpoint
# ---------------------------------------------------------------------------
@app.get("/api/active-cases")
async def active_cases(district: str = Query(default="Mysuru", min_length=2)):
    """Return visible, active, geolocated cases for the requested district."""
    from db.database import run_query

    rows = run_query(
        """
        SELECT
            cm.CaseMasterID AS case_id,
            cm.CrimeNo AS fir_number,
            cm.CrimeRegisteredDate AS date,
            cm.latitude,
            cm.longitude,
            cm.BriefFacts AS summary,
            cs.CaseStatusName AS status,
            csh.CrimeHeadName AS crime_type,
            u.UnitName AS police_station,
            d.DistrictName AS district
        FROM CaseMaster cm
        JOIN CaseStatusMaster cs ON cs.CaseStatusID = cm.CaseStatusID
        LEFT JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
        LEFT JOIN Unit u ON u.UnitID = cm.PoliceStationID
        LEFT JOIN District d ON d.DistrictID = u.DistrictID
        WHERE lower(d.DistrictName) = lower(:district)
          AND cm.latitude IS NOT NULL
          AND cm.longitude IS NOT NULL
          AND lower(cs.CaseStatusName) NOT IN ('closed', 'referred to court')
          AND cm.IsConfidential = 0
        ORDER BY cm.CrimeRegisteredDate DESC
        """,
        {"district": district},
    )

    return {
        "district": district,
        "cases": [
            {
                **row,
                "title": row["crime_type"] or "Registered Crime",
                "location": ", ".join(filter(None, [row["police_station"], row["district"]])),
            }
            for row in rows
        ],
    }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "service": "KSP AI Backend"}


# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
