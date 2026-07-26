import { useState } from "react";
import { FaPaperclip, FaPaperPlane } from "react-icons/fa";

const QUICK_QUERIES = [
  "How many cases in Mysuru?",
  "Show accused in vehicle theft",
  "List cases from 2025",
  "Show criminal network",
];

function ChatInput({ onSend, disabled }) {
  const [query, setQuery] = useState("");
  const [showQuick, setShowQuick] = useState(false);

  const handleSend = () => {
    if (!query.trim() || disabled) return;
    onSend(query.trim());
    setQuery("");
    setShowQuick(false);
  };

  return (
    <div className="space-y-2">
      {/* Quick query chips */}
      {showQuick && (
        <div className="flex flex-wrap gap-2">
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => { onSend(q); setShowQuick(false); }}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1 font-medium transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Quick queries toggle */}
        <button
          onClick={() => setShowQuick(v => !v)}
          title="Quick queries"
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition text-sm font-bold shrink-0"
        >
          💡
        </button>

        {/* Text input */}
        <input
          type="text"
          placeholder={disabled ? "Processing…" : "Ask about FIRs, suspects, crime trends, networks…"}
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={disabled || !query.trim()}
          className="w-10 h-10 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white flex items-center justify-center transition shrink-0"
        >
          <FaPaperPlane size={13} />
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
