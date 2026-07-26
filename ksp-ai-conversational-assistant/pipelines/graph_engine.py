"""
pipelines/graph_engine.py — Case-specific criminal network graph engine.

When a case ID is mentioned, builds a full network for that case:
  - Case node (centre)
  - Accused nodes (red)
  - Victim nodes (blue)
  - Co-accused links (dashed)

When no case ID is mentioned, builds a broader network filtered by keyword.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from db.database import run_query


# ---------------------------------------------------------------------------
# Case ID extraction
# ---------------------------------------------------------------------------

def _extract_case_id(query: str) -> Optional[int]:
    """
    Extract a numeric CaseMasterID from the query.
    Handles patterns like:
      - "case 5", "case id 5", "case number 5"
      - "CaseMasterID 5"
      - bare numbers like "show network 5"
    """
    q = query.lower()

    # Explicit patterns
    patterns = [
        r"case\s*(?:id|master|no|number|#)?\s*[:=]?\s*(\d+)",
        r"casemasterid\s*[:=]?\s*(\d+)",
        r"fir[-\s]?(\d+)",
        r"crime\s*no\.?\s*(\d+)",
        r"\bcase\s+(\d+)\b",
        r"\b(\d+)\b",   # fallback: any bare number
    ]
    for pattern in patterns:
        m = re.search(pattern, q)
        if m:
            return int(m.group(1))
    return None


def _extract_keyword(query: str) -> Optional[str]:
    """Extract a meaningful keyword for broad search (skip short/common words)."""
    skip = {"show", "network", "graph", "link", "criminal", "the", "for",
            "case", "who", "what", "list", "all", "and", "connected", "with"}
    for token in query.split():
        clean = re.sub(r"[^a-zA-Z]", "", token).lower()
        if len(clean) > 3 and clean not in skip:
            return clean
    return None


# ---------------------------------------------------------------------------
# DB fetchers
# ---------------------------------------------------------------------------

def _fetch_case_info(case_id: int) -> Optional[Dict]:
    rows = run_query(f"""
        SELECT
            cm.CaseMasterID,
            cm.CrimeNo,
            cm.BriefFacts,
            cm.CrimeRegisteredDate,
            csh.CrimeHeadName  AS CrimeType,
            u.UnitName         AS PoliceStation,
            cs.CaseStatusName  AS Status
        FROM CaseMaster cm
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
        LEFT JOIN Unit u           ON cm.PoliceStationID  = u.UnitID
        LEFT JOIN CaseStatusMaster cs ON cm.CaseStatusID  = cs.CaseStatusID
        WHERE cm.CaseMasterID = {case_id}
    """)
    return rows[0] if rows else None


def _fetch_accused(case_id: int) -> List[Dict]:
    return run_query(f"""
        SELECT AccusedMasterID, AccusedName, AgeYear, GenderID
        FROM Accused
        WHERE CaseMasterID = {case_id}
    """)


def _fetch_victims(case_id: int) -> List[Dict]:
    return run_query(f"""
        SELECT VictimMasterID, VictimName, AgeYear, GenderID
        FROM Victim
        WHERE CaseMasterID = {case_id}
    """)


def _fetch_complainants(case_id: int) -> List[Dict]:
    return run_query(f"""
        SELECT ComplainantID, ComplainantName, AgeYear
        FROM ComplainantDetails
        WHERE CaseMasterID = {case_id}
    """)


def _fetch_other_cases_of_accused(accused_ids: List[int]) -> List[Dict]:
    """Find other cases these accused persons appear in (cross-case links)."""
    if not accused_ids:
        return []
    ids_str = ",".join(str(i) for i in accused_ids)
    return run_query(f"""
        SELECT
            ac.AccusedMasterID,
            ac.AccusedName,
            ac.CaseMasterID,
            cm.CrimeNo,
            csh.CrimeHeadName AS CrimeType
        FROM Accused ac
        JOIN CaseMaster cm ON ac.CaseMasterID = cm.CaseMasterID
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
        WHERE ac.AccusedMasterID IN ({ids_str})
        ORDER BY ac.CaseMasterID
        LIMIT 30
    """)


def _fetch_accused_by_keyword(keyword: str) -> List[Dict]:
    return run_query(f"""
        SELECT
            ac.AccusedMasterID, ac.AccusedName, ac.AgeYear,
            cm.CaseMasterID,    cm.CrimeNo,
            csh.CrimeHeadName  AS CrimeType,
            u.UnitName         AS PoliceStation
        FROM Accused ac
        JOIN CaseMaster cm ON ac.CaseMasterID = cm.CaseMasterID
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
        LEFT JOIN Unit u           ON cm.PoliceStationID  = u.UnitID
        WHERE LOWER(ac.AccusedName) LIKE LOWER('%{keyword}%')
           OR LOWER(cm.BriefFacts)  LIKE LOWER('%{keyword}%')
        ORDER BY cm.CaseMasterID
        LIMIT 40
    """)


# ---------------------------------------------------------------------------
# Graph builders
# ---------------------------------------------------------------------------

def _build_case_graph(case_id: int, role: str) -> Dict[str, Any]:
    """Build a complete network for one specific case."""
    case = _fetch_case_info(case_id)
    if not case:
        return {"nodes": [], "edges": [], "stats": {}, "error": f"Case {case_id} not found."}

    nodes: Dict[str, Dict] = {}
    edges: List[Dict] = []

    # ── Central case node ──────────────────────────────────────────────────
    case_node_id = f"case_{case_id}"
    crime_label = case.get("CrimeType") or "Crime"
    ps_label    = case.get("PoliceStation") or ""
    nodes[case_node_id] = {
        "id":    case_node_id,
        "label": f"📋 Case #{case_id}\n{crime_label}",
        "type":  "case",
        "meta": {
            "CaseMasterID":  case_id,
            "CrimeNo":       case.get("CrimeNo"),
            "CrimeType":     crime_label,
            "PoliceStation": ps_label,
            "Status":        case.get("Status"),
            "BriefFacts":    (case.get("BriefFacts") or "")[:300],
        },
    }

    # ── Accused nodes ──────────────────────────────────────────────────────
    accused_list = _fetch_accused(case_id)
    accused_ids  = []
    for ac in accused_list:
        node_id = f"acc_{ac['AccusedMasterID']}"
        accused_ids.append(ac["AccusedMasterID"])
        nodes[node_id] = {
            "id":    node_id,
            "label": f"🚔 {ac['AccusedName'] or 'Unknown'}\n(Accused, Age {ac.get('AgeYear', '?')})",
            "type":  "accused",
            "meta": {
                "name": ac["AccusedName"],
                "age":  ac.get("AgeYear"),
                "role": "Accused",
            },
        }
        edges.append({
            "id":     f"e_{node_id}_{case_node_id}",
            "source": node_id,
            "target": case_node_id,
            "label":  "Accused in",
        })

    # ── Victim nodes ───────────────────────────────────────────────────────
    victim_list = _fetch_victims(case_id)
    for vi in victim_list:
        node_id = f"vic_{vi['VictimMasterID']}"
        nodes[node_id] = {
            "id":    node_id,
            "label": f"👤 {vi['VictimName'] or 'Unknown'}\n(Victim, Age {vi.get('AgeYear', '?')})",
            "type":  "victim",
            "meta": {
                "name": vi["VictimName"],
                "age":  vi.get("AgeYear"),
                "role": "Victim",
            },
        }
        edges.append({
            "id":     f"e_{node_id}_{case_node_id}",
            "source": node_id,
            "target": case_node_id,
            "label":  "Victim in",
        })

    # ── Complainant nodes ─────────────────────────────────────────────────
    comp_list = _fetch_complainants(case_id)
    for cp in comp_list:
        node_id = f"comp_{cp['ComplainantID']}"
        nodes[node_id] = {
            "id":    node_id,
            "label": f"📝 {cp['ComplainantName'] or 'Unknown'}\n(Complainant)",
            "type":  "complainant",
            "meta": {
                "name": cp["ComplainantName"],
                "age":  cp.get("AgeYear"),
                "role": "Complainant",
            },
        }
        edges.append({
            "id":     f"e_{node_id}_{case_node_id}",
            "source": node_id,
            "target": case_node_id,
            "label":  "Filed complaint",
        })

    # ── Cross-case links (other cases same accused involved in) ───────────
    if role.upper() == "INSPECTOR" and accused_ids:
        other_cases = _fetch_other_cases_of_accused(accused_ids)
        for row in other_cases:
            other_cid = row["CaseMasterID"]
            if other_cid == case_id:
                continue
            other_node_id = f"case_{other_cid}"
            if other_node_id not in nodes:
                nodes[other_node_id] = {
                    "id":    other_node_id,
                    "label": f"📁 Case #{other_cid}\n{row.get('CrimeType', '')}",
                    "type":  "linked_case",
                    "meta": {
                        "CaseMasterID": other_cid,
                        "CrimeNo":      row.get("CrimeNo"),
                        "CrimeType":    row.get("CrimeType"),
                        "role":         "Linked Case",
                    },
                }
            acc_node_id = f"acc_{row['AccusedMasterID']}"
            edge_id = f"e_{acc_node_id}_{other_node_id}"
            if acc_node_id in nodes and not any(e["id"] == edge_id for e in edges):
                edges.append({
                    "id":     edge_id,
                    "source": acc_node_id,
                    "target": other_node_id,
                    "label":  "Also accused in",
                })

    stats = {
        "total_nodes":    len(nodes),
        "total_edges":    len(edges),
        "accused_count":  len(accused_list),
        "victim_count":   len(victim_list),
        "case_count":     sum(1 for n in nodes.values() if "case" in n["type"]),
    }

    return {"nodes": list(nodes.values()), "edges": edges, "stats": stats, "case_id": case_id}


def _build_keyword_graph(keyword: str, role: str) -> Dict[str, Any]:
    """Build a broader network when no specific case ID is given."""
    links = _fetch_accused_by_keyword(keyword)

    if role.upper() == "CONSTABLE":
        conf_ids = _get_confidential_case_ids()
        links = [r for r in links if r["CaseMasterID"] not in conf_ids]

    nodes: Dict[str, Dict] = {}
    edges: List[Dict] = []
    edge_set: set = set()

    for row in links:
        acc_id   = f"acc_{row['AccusedMasterID']}"
        case_id  = f"case_{row['CaseMasterID']}"

        if acc_id not in nodes:
            nodes[acc_id] = {
                "id":    acc_id,
                "label": f"🚔 {row['AccusedName'] or 'Unknown'}",
                "type":  "accused",
                "meta": {"name": row["AccusedName"], "role": "Accused"},
            }
        if case_id not in nodes:
            nodes[case_id] = {
                "id":    case_id,
                "label": f"📋 Case #{row['CaseMasterID']}\n{row.get('CrimeType', '')}",
                "type":  "case",
                "meta": {
                    "CaseMasterID":  row["CaseMasterID"],
                    "CrimeNo":       row.get("CrimeNo"),
                    "PoliceStation": row.get("PoliceStation"),
                    "role":          "Case",
                },
            }
        key = (acc_id, case_id)
        if key not in edge_set:
            edges.append({
                "id":     f"e_{acc_id}_{case_id}",
                "source": acc_id,
                "target": case_id,
                "label":  "Accused in",
            })
            edge_set.add(key)

    stats = {
        "total_nodes":   len(nodes),
        "total_edges":   len(edges),
        "accused_count": sum(1 for n in nodes.values() if n["type"] == "accused"),
        "case_count":    sum(1 for n in nodes.values() if n["type"] == "case"),
    }
    return {"nodes": list(nodes.values()), "edges": edges, "stats": stats}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_graph(query: str | None = None, role: str = "INSPECTOR", include_co_accused: bool = True) -> Dict[str, Any]:
    """
    Entry point. Detects if query contains a case ID and builds accordingly.
    """
    if query:
        case_id = _extract_case_id(query)
        if case_id:
            return _build_case_graph(case_id, role)
        keyword = _extract_keyword(query)
        if keyword:
            return _build_keyword_graph(keyword, role)

    # Fallback — return all links (limited)
    return _build_keyword_graph("", role)


def _get_confidential_case_ids() -> set:
    try:
        rows = run_query("SELECT CaseMasterID FROM CaseMaster WHERE IsConfidential = 1 OR GravityOffenceID = 3")
        return {r["CaseMasterID"] for r in rows}
    except Exception:
        return set()
