import { useState, useRef } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import { uploadPDF } from "../../services/api.js";

function Reports() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      setFile(null);
      return;
    }
    setError("");
    setResult(null);
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const res = await uploadPDF(file);
      setResult(res);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        <main className="p-6 max-w-4xl w-full mx-auto space-y-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              📈 Intelligence Reports
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload investigative PDF summaries to index them into the AI knowledge base.
              After indexing, the AI Assistant can answer questions from their content.
            </p>
          </div>

          {/* PDF Upload card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              📄 Upload Investigative Report (PDF)
            </h2>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <p className="text-4xl mb-3">📂</p>
              {file ? (
                <div>
                  <p className="font-semibold text-blue-700 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-600 text-sm">
                    Drop a PDF here or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Only .pdf files accepted — max 20 MB
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            {result && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
                <p className="font-bold text-emerald-800 flex items-center gap-2">
                  ✅ Document indexed successfully
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {[
                    ["Filename", result.filename],
                    ["Pages", result.pages],
                    ["Chunks indexed", result.chunks_indexed],
                    ["Total characters", result.total_chars?.toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-white rounded-lg p-3 border border-emerald-100 text-center">
                      <p className="text-xs text-slate-400 font-semibold">{label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{val}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  The AI Assistant can now answer questions from this document.
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⚙️</span> Indexing document…
                </>
              ) : (
                <>📤 Upload &amp; Index PDF</>
              )}
            </button>
          </div>

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-2">ℹ️ How document indexing works</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Upload a PDF investigation report or case summary.</li>
              <li>The backend parses the text and splits it into overlapping chunks.</li>
              <li>Each chunk is embedded with a sentence-transformer model and stored in ChromaDB.</li>
              <li>When an officer asks a descriptive question, the AI retrieves the most relevant chunks and generates a grounded answer with citations.</li>
            </ol>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Reports;
