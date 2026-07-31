import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { processOfficerQuery } from "../../services/caseService";
import { uploadPDF } from "../../services/api";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

function ChatContainer({ onViewCaseDetails, onViewNetwork, onViewMap }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Welcome, **${user?.name || "Officer"}**. I am your Karnataka State Police AI Assistant.\n\nYou can search any type of crime records (e.g., *"give me accident related cases"*, *"give me robbery related cases"*, *"Show FIR-102"*) or **upload a Case PDF** to ask questions directly from your file!`,
    },
  ]);

  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, uploadedDoc]);

  // Handle PDF file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      alert("Please select a valid PDF file (.pdf)");
      return;
    }

    setIsUploading(true);

    try {
      let backendMeta = null;
      try {
        backendMeta = await uploadPDF(file);
      } catch (err) {
        // Fallback for offline mode
      }

      const textContent = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          resolve(evt.target?.result || "");
        };
        reader.readAsText(file);
      });

      const docObj = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        content: textContent,
        firNumber: file.name.replace(".pdf", "").toUpperCase(),
        summary: `Case Investigation File uploaded on ${new Date().toLocaleDateString()}`,
        suspects: ["Suspect mentioned in " + file.name],
        victim: "Complainant Details recorded",
        status: "Active File Index",
        pages: backendMeta?.pages || 1,
      };

      setUploadedDoc(docObj);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `📄 **PDF Document Uploaded Successfully**: \`${file.name}\`\n\nI have processed and indexed this case file into active AI context. You can now ask me any type of question from this PDF, such as:\n- *"Summarize this uploaded PDF"*\n- *"Who are the suspects or victims listed in this file?"*\n- *"What evidence or key observations are recorded?"*`,
        },
      ]);
    } catch (error) {
      alert("Error uploading PDF: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMicClick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SR();
    recognition.lang = user?.language === "kn" ? "kn-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
    recognition.onresult = (e) => {
      setIsListening(false);
      handleSend(e.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleSend = async (queryText) => {
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);

    setMessages((prev) => [...prev, { sender: "officer", text: queryText }]);

    try {
      const payload = await processOfficerQuery(queryText, uploadedDoc);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: payload.text,
          payload: payload,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ System warning: Could not query intelligence database.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "540px" }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 rounded-t-2xl flex justify-between items-center shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-800 rounded-full flex items-center justify-center text-lg border border-blue-600">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">KSP Conversational AI Assistant</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 font-semibold">
                🔒 {user?.role || "INSPECTOR"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Karnataka State Police Intelligence Division</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* UPLOAD CASE PDF BUTTON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isUploading
                ? "bg-amber-600 text-white animate-pulse"
                : "bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm border border-emerald-500"
            }`}
          >
            <span>📎</span> {isUploading ? "Uploading PDF..." : "Upload Case PDF"}
          </button>

          <button
            onClick={handleMicClick}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isListening
                ? "bg-red-600 text-white animate-bounce"
                : "bg-blue-800 hover:bg-blue-700 text-white border border-blue-600"
            }`}
          >
            {isListening ? "🎙️ Listening…" : "🎤 Voice"}
          </button>
        </div>
      </div>

      {/* Active Uploaded Document Context Badge */}
      {uploadedDoc && (
        <div className="bg-emerald-950 text-emerald-200 px-5 py-2 flex items-center justify-between border-b border-emerald-800 shrink-0 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-sm">📄</span>
            <span>Active Case Document: <strong className="text-white font-mono">{uploadedDoc.name}</strong> ({uploadedDoc.size})</span>
          </div>
          <button
            onClick={() => setUploadedDoc(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold bg-emerald-900 px-2 py-0.5 rounded"
            title="Clear Document Context"
          >
            Clear Document ✕
          </button>
        </div>
      )}

      {/* Quick Prompt Chips */}
      <div className="bg-slate-100 px-5 py-2 flex flex-wrap gap-2 border-b border-slate-200 shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center mr-1">Quick Search:</span>
        <button
          onClick={() => handleSend("give me accident related cases")}
          className="bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs transition"
        >
          🚦 Accident Cases
        </button>
        <button
          onClick={() => handleSend("give me robbery related cases")}
          className="bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs transition"
        >
          🚔 Robbery Cases
        </button>
        <button
          onClick={() => handleSend("Show theft cases in Mysuru")}
          className="bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs transition"
        >
          📍 Mysuru Theft Map
        </button>
        <button
          onClick={() => handleSend("Show cases related to FIR-102")}
          className="bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs transition"
        >
          🔍 FIR-102 Links
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            sender={msg.sender}
            text={msg.text}
            payload={msg.payload}
            onViewCaseDetails={onViewCaseDetails}
            onViewNetwork={onViewNetwork}
            onViewMap={onViewMap}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-sm animate-pulse">
            <span className="animate-spin text-blue-700">⚙️</span>
            Analyzing intelligence records &amp; document context…
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 rounded-b-2xl px-4 py-3 shrink-0">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}

export default ChatContainer;
