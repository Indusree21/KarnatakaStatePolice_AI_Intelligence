"""
pipelines/text_to_sql.py — Natural language → SQL using Groq (free, no billing).
Model: llama-3.3-70b-versatile via Groq API
"""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List

from dotenv import load_dotenv
from groq import Groq

from db.database import get_schema_summary, run_query

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


def _generate(system: str, user: str, max_tokens: int = 500) -> str:
    resp = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()


_SQL_SYSTEM = """You are an expert SQL analyst for the Karnataka State Police crime database.
Given the schema and a natural language question, generate a single valid SQLite SELECT query.

Rules:
1. Return ONLY the raw SQL query — no markdown, no explanation, no code fences.
2. Always alias CaseMaster as cm, Accused as ac, Victim as vi, etc.
3. For district filtering join: Unit u ON cm.PoliceStationID = u.UnitID and District d ON u.DistrictID = d.DistrictID.
4. Use LIKE '%keyword%' for name searches (case-insensitive via LOWER()).
5. Never use DROP, INSERT, UPDATE, DELETE, CREATE — read-only.
6. Limit results to 100 rows unless the question asks for counts.
7. If you cannot answer from the schema, return: SELECT 'Query not supported' AS message;

{schema}"""

_NARRATE_SYSTEM = "You are a police data analyst. Be precise and factual."


def _clean_sql(raw: str) -> str:
    raw = re.sub(r"```sql", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"```", "", raw)
    return raw.strip()


def _rows_to_natural_language(rows: List[Dict[str, Any]], question: str) -> str:
    if not rows:
        return "No records found matching your query."
    rows_preview = rows[:20]
    user_msg = (
        f"Question: {question}\n\n"
        f"SQL result ({len(rows)} rows total, showing up to 20):\n{rows_preview}\n\n"
        "Write a concise, factual natural-language answer for a police officer. "
        "Include specific names, case numbers, and counts where relevant."
    )
    return _generate(_NARRATE_SYSTEM, user_msg, max_tokens=600)


def _extract_citations(rows: List[Dict[str, Any]]) -> List[str]:
    citations = []
    for row in rows[:10]:
        parts = []
        if "CaseMasterID" in row:
            parts.append(f"CaseMaster ID #{row['CaseMasterID']}")
        if "CrimeNo" in row:
            parts.append(f"CrimeNo: {row['CrimeNo']}")
        if "UnitName" in row:
            parts.append(f"PS: {row['UnitName']}")
        if parts:
            citations.append(", ".join(parts))
    return citations


def text_to_sql(question: str, role: str = "INSPECTOR") -> Dict[str, Any]:
    schema = get_schema_summary()

    # 1. Generate SQL
    sql = _clean_sql(_generate(_SQL_SYSTEM.format(schema=schema), question, max_tokens=400))

    # 2. RBAC filter for CONSTABLE
    if role.upper() == "CONSTABLE":
        from pipelines.security import apply_constable_sql_filter, sanitize_sql_for_role
        safe, msg = sanitize_sql_for_role(role, sql)
        if not safe:
            return {"sql": sql, "rows": [], "answer_text": msg, "citations": [], "error": "RBAC_BLOCKED"}
        sql = apply_constable_sql_filter(role, sql)

    # 3. Execute
    try:
        rows = run_query(sql)
    except ValueError as exc:
        return {"sql": sql, "rows": [], "answer_text": str(exc), "citations": [], "error": "INVALID_QUERY"}
    except Exception as exc:
        return {"sql": sql, "rows": [], "answer_text": f"Database error: {exc}", "citations": [], "error": "DB_ERROR"}

    # 4. Narrate & cite
    return {
        "sql": sql,
        "rows": rows,
        "answer_text": _rows_to_natural_language(rows, question),
        "citations": _extract_citations(rows),
        "error": None,
    }
