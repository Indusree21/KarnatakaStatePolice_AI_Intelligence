import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { sendChatQuery } from "../../services/api";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SourceCitation from "../visualization/SourceCitation";

function ChatContainer({ onGraphResult }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Welcome, **${user?.name || "Officer"}**. I'm your KSP AI Intelligence Assistant.\n\nYou can ask me things like:\n- *"Show all burglary cases in Mysuru"*\n- *"How many cases were registered in 2025?"*\n- *"Who are the accused in vehicle theft cases?"*\n- *"Describe FIR-102"*\n- *"Show criminal network for Ramesh"*`,
    },
  ]);

  const [citations, setCitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, citations, isLoading]);

  const handleMicClick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Use Chrome or Edge."); return; }
    const recognition = new SR();
    recognition.lang = user?.language === "kn" ? "kn-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    try { recognition.start(); } catch { setIsListening(false); }
    recognition.onresult = (e) => { setIsListening(false); handleSend(e.results[0][0].transcript); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleSend = async (query) => {
    if (!query.trim() || isLoading) return;

    setCitations([]);
    setIsLoading(true);
    setMessages(prev => [...prev, { sender: "officer", text: query }]);

    try {
      const result = await sendChatQuery(
        query,
        user?.userId  || "OFFICER_001",
        user?.role    || "INSPECTOR",
        user?.language || "en"
      );

      setMessages(prev => [...prev, {
        sender: "ai",
        text: result.answer_text,
        queryType: result.query_type,
        status: result.status,
      }]);

      if (result.citations?.length) setCitations(result.citations);

      // If backend returned a graph, bubble it up to Dashboard
      if (result.query_type === "graph" && result.graph_data) {
        onGraphResult?.(result.graph_data);
        setMessages(prev => [...prev, {
          sender: "system",
          text: "🕸️ Network graph loaded — click the Network tab to explore it.",
        }]);
      }

      // Show SQL info as a subtle system note
      if (result.query_type === "text_to_sql" && result.debug?.sql) {
        setMessages(prev => [...prev, {
          sender: "system",
          text: `SQL: ${result.debug.sql}  (${result.debug.row_count ?? 0} rows returned)`,
        }]);
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        sender: "ai",
        text: "⚠️ Could not reach the KSP AI backend. Please ensure the backend server is running on port 8000.",
        status: "error",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
      {/* Chat header */}
      <div className="bg-blue-900 text-white px-5 py-3.5 rounded-t-xl flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-lg">🤖</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">KSP AI Assistant</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                🔒 {user?.role || "INSPECTOR"}
              </span>
            </div>
            <p className="text-[11px] text-blue-200">Karnataka State Police Intelligence System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMicClick}
            title="Voice query"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isListening
                ? "bg-red-600 text-white animate-bounce"
                : "bg-blue-700 hover:bg-blue-600 text-white"
            }`}
          >
            {isListening ? "🎙️ Listening…" : "🎤 Voice"}
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white transition"
          >
            📄 Export
          </button>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4 space-y-2">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            sender={msg.sender}
            text={msg.text}
            queryType={msg.queryType}
            status={msg.status}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 w-fit shadow-sm animate-pulse">
            <span className="animate-spin">⚙️</span>
            Processing with KSP AI Engine…
          </div>
        )}

        {citations.length > 0 && <SourceCitation citations={citations} />}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-slate-200 rounded-b-xl px-4 py-3 shrink-0">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}

export default ChatContainer;
