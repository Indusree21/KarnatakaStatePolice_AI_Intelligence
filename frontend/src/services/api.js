/**
 * api.js — KSP AI Backend service layer
 * Backend: FastAPI on http://localhost:8000
 *
 * Endpoints:
 *   POST /api/chat          — main AI query
 *   POST /api/upload-pdf    — ingest PDF into vector store
 *   GET  /health            — health check
 */

const API_BASE = '/api';

/**
 * Send a natural language query to the KSP AI backend.
 *
 * @param {string} query      - The officer's question
 * @param {string} userId     - Officer employee ID (e.g. "OFFICER_101")
 * @param {"CONSTABLE"|"INSPECTOR"} role - Officer role for RBAC
 * @param {"en"|"kn"} language - Response language
 * @returns {Promise<{
 *   status: "success"|"error",
 *   query_type: "text_to_sql"|"rag"|"graph"|null,
 *   answer_text: string,
 *   citations: string[],
 *   graph_data: {nodes: any[], edges: any[]}|null,
 *   debug: object|null
 * }>}
 */
export async function sendChatQuery(query, userId = 'OFFICER_001', role = 'INSPECTOR', language = 'en') {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      role: role.toUpperCase(),
      language,
      query,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Backend error ${response.status}: ${err}`);
  }

  return response.json();
}

/**
 * Upload a PDF investigative report to be indexed into the vector store.
 *
 * @param {File} file - The PDF file object
 * @returns {Promise<{status: string, filename: string, pages: number, chunks_indexed: number}>}
 */
export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload-pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload error ${response.status}: ${err}`);
  }

  return response.json();
}

/**
 * Check backend health.
 * @returns {Promise<{status: string, service: string}>}
 */
export async function checkHealth() {
  const response = await fetch('/health');
  if (!response.ok) throw new Error('Backend unreachable');
  return response.json();
}
