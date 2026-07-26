"""
pipelines/security.py — RBAC rule enforcer.

Roles:
  CONSTABLE  — Can view standard cases. Blocked from classified / high-gravity cases.
  INSPECTOR  — Full access.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import List


class Role(str, Enum):
    CONSTABLE = "CONSTABLE"
    INSPECTOR = "INSPECTOR"


# Keywords that hint the user is requesting sensitive material
_SENSITIVE_KEYWORDS: List[str] = [
    "classified", "confidential", "secret", "restricted",
    "high gravity", "high-gravity", "gravity 3",
    "espionage", "national security", "attempt to murder",
    "murder", "ipc 302", "ipc 307", "firearm", "gun",
    "suspect alpha", "suspect beta",  # known classified-case accused names
]

# SQL guard: column/value patterns that must not be returned for CONSTABLEs
_BLOCKED_SQL_PATTERNS = [
    r"IsConfidential\s*=\s*1",
    r"GravityOffenceID\s*=\s*3",
]


@dataclass
class SecurityDecision:
    allowed: bool
    reason: str = ""


def check_access(role: str, query: str) -> SecurityDecision:
    """
    Evaluate whether a given role may proceed with the query.

    Returns a SecurityDecision with `allowed=False` and an explicit
    warning message when access should be denied.
    """
    role_upper = role.strip().upper()

    # INSPECTORs have unrestricted access
    if role_upper == Role.INSPECTOR:
        return SecurityDecision(allowed=True)

    if role_upper != Role.CONSTABLE:
        return SecurityDecision(
            allowed=False,
            reason=f"Unknown role '{role}'. Access denied.",
        )

    # CONSTABLE — check query text for sensitive keywords
    query_lower = query.lower()
    for kw in _SENSITIVE_KEYWORDS:
        if kw in query_lower:
            return SecurityDecision(
                allowed=False,
                reason=(
                    f"⚠️  ACCESS DENIED: Your role (CONSTABLE) does not have "
                    f"clearance to access classified or high-gravity case information. "
                    f"Detected restricted keyword: '{kw}'. "
                    f"Please contact your supervising Inspector."
                ),
            )

    return SecurityDecision(allowed=True)


def sanitize_sql_for_role(role: str, sql: str) -> tuple[bool, str]:
    """
    Inspect a generated SQL string and block execution for CONSTABLEs
    if it would access classified records.

    Returns (is_safe, message).
    """
    role_upper = role.strip().upper()

    if role_upper == Role.INSPECTOR:
        return True, ""

    for pattern in _BLOCKED_SQL_PATTERNS:
        if re.search(pattern, sql, re.IGNORECASE):
            return False, (
                "⚠️  ACCESS DENIED: Generated query targets classified records "
                "(IsConfidential=1 or GravityOffenceID=3). "
                "Your CONSTABLE role does not permit access to this data."
            )

    # Automatically append filter to exclude confidential rows for CONSTABLEs
    return True, ""


def apply_constable_sql_filter(role: str, sql: str) -> str:
    """
    For CONSTABLE role, inject a WHERE/AND clause to exclude confidential
    and high-gravity cases from any CaseMaster query.
    """
    role_upper = role.strip().upper()
    if role_upper != Role.CONSTABLE:
        return sql

    # Only patch if CaseMaster is involved
    if "casemaster" not in sql.lower():
        return sql

    filter_clause = "cm.IsConfidential = 0 AND cm.GravityOffenceID < 3"

    # Naive injection — append to existing WHERE or add one
    if re.search(r"\bwhere\b", sql, re.IGNORECASE):
        sql = re.sub(
            r"\bwhere\b",
            f"WHERE {filter_clause} AND ",
            sql,
            count=1,
            flags=re.IGNORECASE,
        )
    else:
        # Insert before GROUP BY / ORDER BY / LIMIT or at end
        for keyword in ("group by", "order by", "limit", "having"):
            idx = sql.lower().find(keyword)
            if idx != -1:
                sql = sql[:idx] + f" WHERE {filter_clause} " + sql[idx:]
                return sql
        sql = sql.rstrip(";") + f" WHERE {filter_clause}"

    return sql
