import { FaUserShield, FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import CaseSummaryCard from "./CaseSummaryCard";
import { generateCasePDF } from "../../utils/pdfGenerator";

function ChatMessage({
  sender,
  text,
  payload,
  onViewCaseDetails,
  onViewNetwork,
  onViewMap,
}) {
  const isOfficer = sender === "officer";
  const isSystem = sender === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOfficer ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${isOfficer ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm mt-1 ${
            isOfficer ? "bg-blue-900" : "bg-emerald-700"
          }`}
        >
          {isOfficer ? <FaUserShield size={13} /> : <FaRobot size={13} />}
        </div>

        {/* Message Content */}
        <div className="flex flex-col space-y-2 w-full">
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm text-xs sm:text-sm ${
              isOfficer
                ? "bg-blue-900 text-white rounded-tr-xs"
                : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
            }`}
          >
            <p className={`text-[11px] font-bold mb-1 ${isOfficer ? "text-blue-200" : "text-slate-400"}`}>
              {isOfficer ? "Officer" : "KSP AI Intelligence Assistant"}
            </p>

            {isOfficer ? (
              <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-1 text-slate-800">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Structured Payload Renderers */}
          {!isOfficer && payload && (
            <div className="space-y-3">
              {/* SINGLE CASE DETAILS PAYLOAD */}
              {payload.type === "CASE_DETAILS" && payload.caseData && (
                <CaseSummaryCard
                  caseData={payload.caseData}
                  onViewNetwork={() => onViewNetwork?.(payload.caseData)}
                />
              )}

              {/* RELATED CASES PAYLOAD */}
              {payload.type === "RELATED_CASES" && payload.relatedCases && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <span>🔗</span> Related &amp; Connected Investigation Files
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {payload.relatedCases.map((rc, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                              {rc.firNumber || rc.id}
                            </span>
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                              {rc.status || "Linked"}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs text-slate-900 mt-1.5">{rc.crimeType || rc.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">📍 {rc.location}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{rc.summary}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onViewCaseDetails?.(rc)}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition text-center"
                          >
                            View Case Summary
                          </button>
                          <button
                            onClick={() => generateCasePDF(rc)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition"
                            title="Generate PDF"
                          >
                            📄 PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAP SEARCH PAYLOAD */}
              {payload.type === "MAP_SEARCH" && payload.mapData && (
                <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 rounded-2xl border border-blue-800 shadow-md space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🗺️</span> Interactive Geo-Spatial Map View
                      </h4>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {payload.mapData.totalCases} Theft Cases Plotted in {payload.mapData.city} Region
                      </p>
                    </div>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                      Active Grid
                    </span>
                  </div>

                  <button
                    onClick={() => onViewMap?.(payload.mapData)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>📍</span> Open Interactive Mysuru Crime Map
                  </button>
                </div>
              )}

              {/* NETWORK GRAPH PAYLOAD */}
              {payload.type === "NETWORK_GRAPH" && payload.caseData && (
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-md space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🕸️</span> Criminal Network Topology
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Multi-tiered node links identified for {payload.caseData.firNumber}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewNetwork?.(payload.caseData)}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>🕸️</span> Open Multi-Node Network Graph
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
