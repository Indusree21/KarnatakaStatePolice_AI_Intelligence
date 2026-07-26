import { FaUserShield, FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

const QUERY_TYPE_LABEL = {
  text_to_sql: { label: "SQL Query", color: "bg-blue-100 text-blue-700" },
  rag: { label: "Document Search", color: "bg-purple-100 text-purple-700" },
  graph: { label: "Network Graph", color: "bg-orange-100 text-orange-700" },
};

function ChatMessage({ sender, text, queryType, status }) {
  const isOfficer = sender === "officer";
  const isSystem = sender === "system";
  const isError = status === "error";

  // System messages (SQL debug info) — subtle inline note
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 max-w-full truncate">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOfficer ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`flex items-end gap-2 max-w-[80%] ${isOfficer ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${
            isOfficer ? "bg-blue-700" : isError ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {isOfficer ? <FaUserShield size={14} /> : <FaRobot size={14} />}
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
            isOfficer
              ? "bg-blue-700 text-white rounded-br-sm"
              : isError
              ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-sm"
              : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
          }`}
        >
          <p className={`text-xs font-semibold mb-1.5 ${isOfficer ? "text-blue-200" : "text-gray-400"}`}>
            {isOfficer ? "Officer" : "AI Assistant"}
            {queryType && QUERY_TYPE_LABEL[queryType] && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${QUERY_TYPE_LABEL[queryType].color}`}>
                {QUERY_TYPE_LABEL[queryType].label}
              </span>
            )}
          </p>

          {isOfficer ? (
            <p className="whitespace-pre-wrap">{text}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-1">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}

          <p className={`text-[10px] mt-1.5 ${isOfficer ? "text-blue-200" : "text-gray-400"}`}>
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
