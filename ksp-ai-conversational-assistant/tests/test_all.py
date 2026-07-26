"""
tests/test_all.py — Integration tests for all four deliverables.
Mocks OpenAI so no API key is needed.
Run: python -m pytest tests/test_all.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Seed DB once before any test imports touch it
os.environ.setdefault("OPENAI_API_KEY", "test-key-no-calls")
from init_db import init_database
init_database()

import json
import pytest
from unittest.mock import MagicMock, patch


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _mock_openai_response(content: str):
    """Build a minimal mock that looks like an OpenAI ChatCompletion response."""
    choice = MagicMock()
    choice.message.content = content
    resp = MagicMock()
    resp.choices = [choice]
    return resp


# ─────────────────────────────────────────────────────────────────────────────
# 1. DB / init_db
# ─────────────────────────────────────────────────────────────────────────────
class TestDatabase:
    def test_tables_exist(self):
        from db.database import run_query
        tables = run_query(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        names = {r["name"] for r in tables}
        required = {
            "CaseMaster", "Accused", "Victim", "ComplainantDetails",
            "ArrestSurrender", "District", "Unit", "Employee", "Rank",
            "CaseStatusMaster", "CrimeHead", "CrimeSubHead",
        }
        assert required.issubset(names), f"Missing tables: {required - names}"

    def test_seed_case_count(self):
        from db.database import run_query
        rows = run_query("SELECT COUNT(*) AS cnt FROM CaseMaster")
        assert rows[0]["cnt"] >= 15, "Expected at least 15 seeded cases"

    def test_accused_linked_to_cases(self):
        from db.database import run_query
        rows = run_query(
            "SELECT COUNT(*) AS cnt FROM Accused WHERE CaseMasterID IS NOT NULL"
        )
        assert rows[0]["cnt"] > 0

    def test_confidential_flag_exists(self):
        from db.database import run_query
        rows = run_query(
            "SELECT COUNT(*) AS cnt FROM CaseMaster WHERE IsConfidential = 1"
        )
        assert rows[0]["cnt"] >= 1, "Need at least one confidential case for RBAC tests"

    def test_run_query_rejects_mutation(self):
        from db.database import run_query
        with pytest.raises(ValueError, match="Only SELECT"):
            run_query("DROP TABLE CaseMaster")

    def test_schema_summary_contains_key_tables(self):
        from db.database import get_schema_summary
        schema = get_schema_summary()
        for tbl in ("CaseMaster", "Accused", "Victim", "District"):
            assert tbl in schema


# ─────────────────────────────────────────────────────────────────────────────
# 2. RBAC / Security
# ─────────────────────────────────────────────────────────────────────────────
class TestSecurity:
    def test_inspector_always_allowed(self):
        from pipelines.security import check_access
        d = check_access("INSPECTOR", "show classified murder cases gravity 3")
        assert d.allowed is True

    def test_constable_allowed_normal_query(self):
        from pipelines.security import check_access
        d = check_access("CONSTABLE", "show all house burglaries in Mysuru")
        assert d.allowed is True

    @pytest.mark.parametrize("keyword", [
        "classified", "confidential", "murder", "attempt to murder",
        "high gravity", "espionage", "national security", "firearm",
    ])
    def test_constable_blocked_on_sensitive_keyword(self, keyword):
        from pipelines.security import check_access
        d = check_access("CONSTABLE", f"show me {keyword} cases")
        assert d.allowed is False
        assert "ACCESS DENIED" in d.reason

    def test_unknown_role_denied(self):
        from pipelines.security import check_access
        d = check_access("ADMIN", "any query")
        assert d.allowed is False

    def test_sanitize_sql_blocks_confidential_for_constable(self):
        from pipelines.security import sanitize_sql_for_role
        sql = "SELECT * FROM CaseMaster cm WHERE cm.IsConfidential = 1"
        safe, msg = sanitize_sql_for_role("CONSTABLE", sql)
        assert safe is False
        assert "ACCESS DENIED" in msg

    def test_sanitize_sql_blocks_high_gravity_for_constable(self):
        from pipelines.security import sanitize_sql_for_role
        sql = "SELECT * FROM CaseMaster cm WHERE cm.GravityOffenceID = 3"
        safe, msg = sanitize_sql_for_role("CONSTABLE", sql)
        assert safe is False

    def test_sanitize_sql_passes_inspector(self):
        from pipelines.security import sanitize_sql_for_role
        sql = "SELECT * FROM CaseMaster cm WHERE cm.IsConfidential = 1"
        safe, msg = sanitize_sql_for_role("INSPECTOR", sql)
        assert safe is True

    def test_apply_constable_filter_injects_where(self):
        from pipelines.security import apply_constable_sql_filter
        sql = "SELECT * FROM CaseMaster cm ORDER BY CaseMasterID"
        filtered = apply_constable_sql_filter("CONSTABLE", sql)
        assert "IsConfidential" in filtered
        assert "GravityOffenceID" in filtered

    def test_apply_constable_filter_skips_inspector(self):
        from pipelines.security import apply_constable_sql_filter
        sql = "SELECT * FROM CaseMaster cm"
        result = apply_constable_sql_filter("INSPECTOR", sql)
        assert result == sql  # unchanged


# ─────────────────────────────────────────────────────────────────────────────
# 3. Text-to-SQL
# ─────────────────────────────────────────────────────────────────────────────
class TestTextToSQL:
    @patch("pipelines.text_to_sql._get_client")
    def test_basic_count_query(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response("SELECT COUNT(*) AS total FROM CaseMaster cm"),
            _mock_openai_response("There are 18 cases in the database."),
        ]
        from pipelines.text_to_sql import text_to_sql
        result = text_to_sql("How many cases are registered?", role="INSPECTOR")
        assert result["error"] is None
        assert len(result["rows"]) == 1
        assert "total" in result["rows"][0]
        assert result["rows"][0]["total"] >= 15

    @patch("pipelines.text_to_sql._get_client")
    def test_accused_name_search(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response(
                "SELECT ac.AccusedName, cm.CrimeNo, cm.CaseMasterID "
                "FROM Accused ac JOIN CaseMaster cm ON ac.CaseMasterID = cm.CaseMasterID "
                "WHERE LOWER(ac.AccusedName) LIKE LOWER('%Manjunath%')"
            ),
            _mock_openai_response("Manjunath is accused in case CR/102/2026."),
        ]
        from pipelines.text_to_sql import text_to_sql
        result = text_to_sql("Find accused named Manjunath", role="INSPECTOR")
        assert result["error"] is None
        assert any("Manjunath" in str(r.get("AccusedName", "")) for r in result["rows"])

    @patch("pipelines.text_to_sql._get_client")
    def test_district_filter(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response(
                "SELECT cm.CaseMasterID, cm.CrimeNo, d.DistrictName "
                "FROM CaseMaster cm "
                "JOIN Unit u ON cm.PoliceStationID = u.UnitID "
                "JOIN District d ON u.DistrictID = d.DistrictID "
                "WHERE LOWER(d.DistrictName) LIKE '%mysuru%'"
            ),
            _mock_openai_response("3 cases found in Mysuru district."),
        ]
        from pipelines.text_to_sql import text_to_sql
        result = text_to_sql("Show cases in Mysuru", role="INSPECTOR")
        assert result["error"] is None

    @patch("pipelines.text_to_sql._get_client")
    def test_constable_rbac_blocks_confidential_sql(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response(
                "SELECT * FROM CaseMaster cm WHERE cm.IsConfidential = 1"
            ),
        ]
        from pipelines.text_to_sql import text_to_sql
        result = text_to_sql("Show confidential cases", role="CONSTABLE")
        assert result["error"] == "RBAC_BLOCKED"
        assert "ACCESS DENIED" in result["answer_text"]

    @patch("pipelines.text_to_sql._get_client")
    def test_case_status_query(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response(
                "SELECT cm.CaseMasterID, cm.CrimeNo, cs.CaseStatusName "
                "FROM CaseMaster cm "
                "JOIN CaseStatusMaster cs ON cm.CaseStatusID = cs.CaseStatusID "
                "WHERE cs.CaseStatusName = 'Under Investigation'"
            ),
            _mock_openai_response("7 cases are currently under investigation."),
        ]
        from pipelines.text_to_sql import text_to_sql
        result = text_to_sql("Which cases are under investigation?", role="INSPECTOR")
        assert result["error"] is None

    @patch("pipelines.text_to_sql._get_client")
    def test_citations_extracted(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response(
                "SELECT cm.CaseMasterID, cm.CrimeNo, u.UnitName "
                "FROM CaseMaster cm JOIN Unit u ON cm.PoliceStationID = u.UnitID LIMIT 5"
            ),
            _mock_openai_response("Here are the top 5 cases."),
        ]
        from pipelines.text_to_sql import text_to_sql
        result = text_to_sql("List recent cases", role="INSPECTOR")
        assert isinstance(result["citations"], list)
        if result["rows"]:
            assert len(result["citations"]) > 0
            assert "CaseMaster ID" in result["citations"][0]


# ─────────────────────────────────────────────────────────────────────────────
# 4. Vector Store / ChromaDB
# ─────────────────────────────────────────────────────────────────────────────
class TestVectorStore:
    def test_index_and_search(self):
        from pipelines.vector_store import index_brief_facts, similarity_search
        cases = [
            {
                "CaseMasterID": 9001,
                "CrimeNo": "TEST001",
                "BriefFacts": "Test burglary case in Bengaluru involving gold theft.",
                "PoliceStationID": 2,
                "IsConfidential": 0,
            }
        ]
        count = index_brief_facts(cases)
        assert count == 1

        hits = similarity_search("burglary gold theft", n_results=3, role="INSPECTOR")
        assert isinstance(hits, list)
        assert len(hits) >= 1
        assert "document" in hits[0]
        assert "metadata" in hits[0]

    def test_confidential_filtered_for_constable(self):
        from pipelines.vector_store import index_brief_facts, similarity_search
        # Index a confidential document
        index_brief_facts([{
            "CaseMasterID": 9002,
            "CrimeNo": "SECRET001",
            "BriefFacts": "Top secret espionage national security case xyzabc.",
            "PoliceStationID": 2,
            "IsConfidential": 1,
        }])
        hits = similarity_search(
            "espionage national security xyzabc", n_results=5, role="CONSTABLE"
        )
        confidential_hits = [
            h for h in hits
            if h["metadata"].get("IsConfidential") == "1"
        ]
        assert len(confidential_hits) == 0, "CONSTABLE should not see confidential docs"

    def test_inspector_sees_confidential(self):
        from pipelines.vector_store import index_brief_facts, similarity_search
        index_brief_facts([{
            "CaseMasterID": 9003,
            "CrimeNo": "SECRET002",
            "BriefFacts": "Classified top secret operation delta zulu xyzqrs.",
            "PoliceStationID": 2,
            "IsConfidential": 1,
        }])
        hits = similarity_search(
            "classified operation delta zulu xyzqrs", n_results=5, role="INSPECTOR"
        )
        assert any(h["metadata"].get("IsConfidential") == "1" for h in hits)

    def test_rebuild_index_from_db(self):
        from pipelines.vector_store import rebuild_index_from_db
        count = rebuild_index_from_db()
        assert count >= 15


# ─────────────────────────────────────────────────────────────────────────────
# 5. RAG Engine
# ─────────────────────────────────────────────────────────────────────────────
class TestRAGEngine:
    @patch("pipelines.rag_engine._get_client")
    def test_rag_returns_answer_with_citations(self, mock_get_client):
        from pipelines.vector_store import rebuild_index_from_db
        rebuild_index_from_db()

        mock_get_client.return_value.chat.completions.create.return_value = (
            _mock_openai_response(
                "Based on CaseMaster ID #101 (CrimeNo: 104430006202600001), "
                "a burglary occurred in Kuvempunagar, Mysuru."
            )
        )
        from pipelines.rag_engine import rag_query
        result = rag_query("What happened in house burglary cases?", role="INSPECTOR")
        assert "answer_text" in result
        assert len(result["answer_text"]) > 10
        assert isinstance(result["citations"], list)

    @patch("pipelines.rag_engine._get_client")
    def test_rag_constable_no_confidential(self, mock_get_client):
        mock_get_client.return_value.chat.completions.create.return_value = (
            _mock_openai_response("No classified information returned.")
        )
        from pipelines.rag_engine import rag_query
        result = rag_query("espionage national security", role="CONSTABLE")
        for citation in result.get("citations", []):
            assert "SECRET" not in citation

    def test_ingest_pdf(self):
        from pipelines.rag_engine import ingest_pdf
        # Minimal single-page PDF built from raw bytes (no extra library needed)
        # This is a well-formed PDF 1.4 with one page containing plain text.
        pdf_bytes = (
            b"%PDF-1.4\n"
            b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]"
            b" /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
            b"4 0 obj\n<< /Length 90 >>\nstream\n"
            b"BT /F1 12 Tf 72 720 Td "
            b"(Investigative summary Robbery Mangaluru petrol station case 104430006202600011) Tj ET\n"
            b"endstream\nendobj\n"
            b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
            b"xref\n0 6\n0000000000 65535 f \n"
            b"0000000009 00000 n \n0000000058 00000 n \n"
            b"0000000115 00000 n \n0000000274 00000 n \n"
            b"0000000416 00000 n \n"
            b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n499\n%%EOF"
        )
        result = ingest_pdf(pdf_bytes, "test_summary.pdf")
        assert result["filename"] == "test_summary.pdf"
        assert result["pages"] == 1


# ─────────────────────────────────────────────────────────────────────────────
# 6. Graph Engine
# ─────────────────────────────────────────────────────────────────────────────
class TestGraphEngine:
    def test_graph_returns_nodes_and_edges(self):
        from pipelines.graph_engine import build_graph
        graph = build_graph(role="INSPECTOR")
        assert "nodes" in graph
        assert "edges" in graph
        assert len(graph["nodes"]) > 0
        assert len(graph["edges"]) > 0

    def test_graph_node_types(self):
        from pipelines.graph_engine import build_graph
        graph = build_graph(role="INSPECTOR")
        types = {n["type"] for n in graph["nodes"]}
        assert "accused" in types
        assert "case" in types

    def test_graph_excludes_confidential_for_constable(self):
        from pipelines.graph_engine import build_graph
        from db.database import run_query
        conf_ids = {
            str(r["CaseMasterID"])
            for r in run_query(
                "SELECT CaseMasterID FROM CaseMaster WHERE IsConfidential=1 OR GravityOffenceID=3"
            )
        }
        graph = build_graph(role="CONSTABLE")
        case_nodes = [n for n in graph["nodes"] if n["type"] == "case"]
        for node in case_nodes:
            node_case_id = node["id"].replace("case_", "")
            assert node_case_id not in conf_ids, \
                f"Confidential case node {node_case_id} exposed to CONSTABLE"

    def test_graph_keyword_filter(self):
        from pipelines.graph_engine import build_graph
        graph = build_graph(query="burglary", role="INSPECTOR")
        assert "nodes" in graph

    def test_graph_stats(self):
        from pipelines.graph_engine import build_graph
        graph = build_graph(role="INSPECTOR")
        stats = graph["stats"]
        assert stats["total_nodes"] == len(graph["nodes"])
        assert stats["total_edges"] == len(graph["edges"])
        assert stats["accused_count"] + stats["case_count"] == stats["total_nodes"]


# ─────────────────────────────────────────────────────────────────────────────
# 7. FastAPI /api/chat endpoint (intent router)
# ─────────────────────────────────────────────────────────────────────────────
class TestChatEndpoint:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        # Use context manager style to keep app alive for the test
        with TestClient(app) as c:
            yield c

    def test_health_check(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    @patch("pipelines.text_to_sql._get_client")
    def test_sql_intent_route(self, mock_get_client, client):
        mock_get_client.return_value.chat.completions.create.side_effect = [
            _mock_openai_response("SELECT COUNT(*) AS cnt FROM CaseMaster cm"),
            _mock_openai_response("There are 18 total cases."),
        ]
        r = client.post("/api/chat", json={
            "user_id": "OFFICER_1",
            "role": "INSPECTOR",
            "language": "en",
            "query": "How many total cases are registered?",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"
        assert body["query_type"] == "text_to_sql"
        assert len(body["answer_text"]) > 0

    def test_graph_intent_route(self, client):
        r = client.post("/api/chat", json={
            "user_id": "OFFICER_2",
            "role": "INSPECTOR",
            "language": "en",
            "query": "Show criminal network and links between accused gang members",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"
        assert body["query_type"] == "graph"
        assert body["graph_data"] is not None
        assert len(body["graph_data"]["nodes"]) > 0

    @patch("pipelines.rag_engine._get_client")
    def test_rag_intent_route(self, mock_get_client, client):
        mock_get_client.return_value.chat.completions.create.return_value = (
            _mock_openai_response("Based on CaseMaster ID #101, a burglary occurred in Mysuru.")
        )
        r = client.post("/api/chat", json={
            "user_id": "OFFICER_3",
            "role": "INSPECTOR",
            "language": "en",
            "query": "What happened in the Mysuru burglary incident? Describe the details.",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"
        assert body["query_type"] == "rag"

    def test_constable_blocked_on_sensitive_query(self, client):
        r = client.post("/api/chat", json={
            "user_id": "CONSTABLE_5",
            "role": "CONSTABLE",
            "language": "en",
            "query": "Show all classified murder cases with high gravity offences",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "error"
        assert "ACCESS DENIED" in body["answer_text"]

    def test_constable_allowed_on_normal_query(self, client):
        r = client.post("/api/chat", json={
            "user_id": "CONSTABLE_6",
            "role": "CONSTABLE",
            "language": "en",
            "query": "Show criminal network connections between accused",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"

    def test_invalid_role_rejected_by_pydantic(self, client):
        r = client.post("/api/chat", json={
            "user_id": "X",
            "role": "HACKER",
            "language": "en",
            "query": "test",
        })
        assert r.status_code == 422

    def test_response_schema_complete(self, client):
        r = client.post("/api/chat", json={
            "user_id": "OFFICER_7",
            "role": "INSPECTOR",
            "language": "en",
            "query": "Show criminal network links between gang members",
        })
        body = r.json()
        for field in ("status", "answer_text", "citations", "query_type"):
            assert field in body, f"Missing field: {field}"
