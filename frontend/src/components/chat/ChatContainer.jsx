import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import NetworkGraph from "../visualization/NetworkGraph";
import CaseSummaryCard from "./CaseSummaryCard";
import CrimeMap from "../visualization/CrimeMap";

function ChatContainer() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Welcome Officer. Ask me about any FIR, suspect, crime trend or location.",
    },
  ]);

  const [showNetwork, setShowNetwork] = useState(false);
  const [showCaseCard, setShowCaseCard] = useState(false);
  const [showCrimeMap, setShowCrimeMap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null);

  const sampleCase = {
    firNumber: "FIR-102",
    crimeType: "Vehicle Theft",
    location: "Mysuru South Police Station",
    date: "15 July 2026",
    status: "Under Active Investigation",
    confidence: "96%",
    threatLevel: "HIGH",
    priority: "HIGH",
    recommendation: "Immediate Dispatch & Network Surveillance in Mandya",
    evidenceScore: "89%",
    summary:
      "Two unidentified suspects stole a motorcycle from the railway station parking area at approximately 9:30 PM. CCTV footage captured suspects escaping towards Bannimantap Road.",
    persons: [
      "🚹 Ravi Kumar (Victim)",
      "🚔 Ramesh (Primary Suspect - Repeat Offender)",
      "🚔 Suresh (Associate - Absconding)",
    ],
    evidence: [
      "CCTV Footage (#Cam-14)",
      "Latent Fingerprints",
      "Witness Statement (Anand)",
    ],
    observations: [
      "Possible repeat offender active in Mysuru-Mandya belt.",
      "Similar M.O. identified in 2 prior registered vehicle thefts.",
      "High probability of vehicle transportation via SH-17.",
    ],
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showCaseCard, showNetwork, showCrimeMap, isLoading]);

  const handleMicClick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setIsListening(false);
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (transcript.trim()) {
        handleSend(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleSend = async (query) => {
    if (!query.trim() || isLoading) return;

    const lowerQuery = query.toLowerCase();

    // Reset view widgets by default
    setShowNetwork(false);
    setShowCaseCard(false);
    setShowCrimeMap(false);
    setIsLoading(true);

    // Push officer query to chat
    setMessages((prev) => [...prev, { sender: "officer", text: query }]);

    // Check for explicit trigger words for visual components first
    if (
      lowerQuery.includes("mysuru") ||
      lowerQuery.includes("bangalore") ||
      lowerQuery.includes("crime map") ||
      lowerQuery.includes("locations") ||
      lowerQuery.includes("theft")
    ) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "15 matching crime records found for your query. Interactive Crime Map loaded below:",
        },
      ]);
      setShowCrimeMap(true);
      return;
    }

    if (lowerQuery.includes("fir-102") || lowerQuery === "102") {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "FIR-102 record fetched successfully. AI Risk Score: 96% (High Priority).",
        },
      ]);
      setShowCaseCard(true);
      setShowNetwork(true);
      return;
    }

    // Dynamic AI Processing with Gemini API & localStorage FIRs
    try {
      const savedFirs = JSON.parse(localStorage.getItem("firs") || "[]");

      let firContext = "No custom FIRs registered yet.";
      if (savedFirs.length > 0) {
        firContext = savedFirs
          .map(
            (fir) =>
              `FIR Number: ${fir.firNumber}
Complainant: ${fir.complainantName} (Contact: ${fir.contactNumber})
Category: ${fir.incidentType}
Jurisdiction: ${fir.location}
Date & Time: ${fir.incidentDate} at ${fir.incidentTime}
Priority: ${fir.priority}
Status: ${fir.status || "Under Active Investigation"}
Description: ${fir.description}
----------------------------------------`
          )
          .join("\n");
      }

      const fullPrompt = `You are an AI intelligence assistant for the Karnataka State Police.
Here is the current FIR database from localStorage:

${firContext}

Officer Query: "${query}"

Instructions:
1. If the user asks about a specific FIR (e.g. FIR-202, FIR-543), search the records provided above.
2. If found, summarize the complainant, incident type, date, location, priority, and description clearly.
3. If not found in the custom records or sample case, provide a concise, professional response as a law enforcement AI assistant.`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("API Key missing");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        }
      );

      const data = await response.json();
      const aiReply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No matching records found in Karnataka State Police database.";

      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (err) {
      console.error("Gemini API Error:", err);

      // Fallback check in local storage if API call fails or key is missing
      const savedFirs = JSON.parse(localStorage.getItem("firs") || "[]");
      const matchedFir = savedFirs.find(
        (f) =>
          f.firNumber.toLowerCase() === lowerQuery.trim() ||
          lowerQuery.includes(f.firNumber.toLowerCase())
      );

      if (matchedFir) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `📋 FIR Found: ${matchedFir.firNumber}\n• Complainant: ${matchedFir.complainantName} (${matchedFir.contactNumber})\n• Category: ${matchedFir.incidentType}\n• Station: ${matchedFir.location}\n• Date/Time: ${matchedFir.incidentDate} ${matchedFir.incidentTime}\n• Priority: ${matchedFir.priority}\n• Details: ${matchedFir.description}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "No matching records found in Karnataka State Police database.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex flex-col h-[650px]">
      {/* HEADER */}
      <div className="bg-blue-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                KSP AI Conversational Assistant
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                🔒 LEVEL-3 RBAC: INSPECTOR
              </span>
            </div>
            <p className="text-xs text-blue-200">
              Karnataka State Police Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={handleExportPDF}
            className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition text-white"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* CHAT LOG AREA - VISUALIZATIONS RENDER INSIDE HERE NOW */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            sender={msg.sender}
            text={msg.text}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-slate-100 p-3 rounded-lg w-fit animate-pulse">
            <span className="animate-spin">⚙️</span> Processing query with KSP AI Engine...
          </div>
        )}

        {/* INLINE CASE SUMMARY CARD */}
        {showCaseCard && (
          <div className="bg-white rounded-xl border border-red-200 shadow-md p-5 space-y-4 my-3">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full">
                  🤖 AI Investigation Output
                </span>
                <h3 className="text-xl font-bold text-gray-800 mt-2">
                  Case Analysis: FIR-102
                </h3>
              </div>
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                THREAT LEVEL: HIGH
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                <p className="text-xs text-gray-500 font-medium">
                  Confidence Score
                </p>
                <p className="text-lg font-extrabold text-blue-700">
                  {sampleCase.confidence}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                <p className="text-xs text-gray-500 font-medium">
                  Evidence Score
                </p>
                <p className="text-lg font-extrabold text-emerald-700">
                  {sampleCase.evidenceScore}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                <p className="text-xs text-gray-500 font-medium">
                  Priority Level
                </p>
                <p className="text-lg font-extrabold text-amber-600">
                  {sampleCase.priority}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                <p className="text-xs text-gray-500 font-medium">Status</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {sampleCase.status}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-sm text-amber-900">
              <strong>AI Recommendation:</strong> {sampleCase.recommendation}
            </div>

            <CaseSummaryCard
              caseData={sampleCase}
              onViewNetwork={() => setShowNetwork(true)}
            />
          </div>
        )}

        {/* INLINE CRIME MAP */}
        {showCrimeMap && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm my-3">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              📍 Area Geographic Analysis
            </h4>
            <div className="h-[350px] overflow-hidden rounded-lg">
              <CrimeMap />
            </div>
          </div>
        )}

        {/* INLINE NETWORK GRAPH */}
        {showNetwork && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm my-3">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              🕸️ Suspect Network & Associate Mapping
            </h4>
            <div className="h-[350px] overflow-hidden rounded-lg">
              <NetworkGraph />
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
        <button
          onClick={handleMicClick}
          className={`p-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs ${
            isListening
              ? "bg-red-600 text-white animate-bounce"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
          title="Click to speak"
        >
          {isListening ? "🎙️ Listening (EN)..." : "🎤 Voice Query (EN)"}
        </button>

        <div className="flex-1">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;