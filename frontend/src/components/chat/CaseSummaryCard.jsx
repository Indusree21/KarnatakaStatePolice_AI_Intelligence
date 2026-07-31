import React from "react";
import { generateCasePDF } from "../../utils/pdfGenerator";

function CaseSummaryCard({ caseData, onViewNetwork, onSelectCase }) {
  if (!caseData) return null;

  const handleDownloadPDF = (e) => {
    e.stopPropagation();
    generateCasePDF(caseData);
  };

  const victimText = Array.isArray(caseData.victim)
    ? caseData.victim.join(", ")
    : caseData.victim || (caseData.persons ? caseData.persons.filter(p => p.toLowerCase().includes("victim")).join(", ") : "Complainant statement recorded");

  const suspectsList = Array.isArray(caseData.suspects)
    ? caseData.suspects
    : Array.isArray(caseData.accused)
    ? caseData.accused
    : caseData.persons ? caseData.persons.filter(p => p.toLowerCase().includes("suspect") || p.toLowerCase().includes("accused"))
    : ["Under investigation"];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg mt-4 overflow-hidden text-slate-800">
      {/* Header */}
      <div className="bg-blue-900 text-white px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">📄</span>
          <div>
            <h2 className="text-base font-bold">Complete Case Summary</h2>
            <p className="text-[11px] text-blue-200">Karnataka State Police Intelligence Division</p>
          </div>
        </div>
        {caseData.firNumber && (
          <span className="bg-blue-950 text-blue-300 text-xs px-3 py-1 rounded-md font-mono font-bold border border-blue-700">
            {caseData.firNumber}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Key Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">FIR Number</p>
            <p className="font-bold text-slate-900 text-sm">{caseData.firNumber || caseData.id || "N/A"}</p>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Crime Type</p>
            <p className="font-bold text-slate-900 text-sm">{caseData.crimeType || caseData.title || "N/A"}</p>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Date of Incident</p>
            <p className="font-bold text-slate-900 text-sm">{caseData.date || caseData.time || "N/A"}</p>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Location</p>
            <p className="font-bold text-slate-900 text-sm">{caseData.location || "Mysuru District"}</p>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Victim</p>
            <p className="font-semibold text-slate-800 text-xs mt-0.5">{victimText}</p>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Status</p>
            <span className="inline-block mt-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {caseData.status || "Under Investigation"}
            </span>
          </div>
        </div>

        {/* Incident Brief / Summary */}
        {caseData.summary && (
          <div>
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              📝 Incident Brief
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-inner">
              {caseData.summary}
            </p>
          </div>
        )}

        {/* Suspects */}
        <div>
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            🚔 Suspect(s) &amp; Accused
          </h3>
          <div className="flex flex-wrap gap-2">
            {suspectsList.map((person, index) => (
              <span key={index} className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                <span>👤</span> {person}
              </span>
            ))}
          </div>
        </div>

        {/* Evidence Collected */}
        {caseData.evidence && caseData.evidence.length > 0 && (
          <div>
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              🔍 Evidence Collected
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {caseData.evidence.map((item, index) => (
                <li key={index} className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Findings / Observations */}
        {caseData.observations && caseData.observations.length > 0 && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
            <h3 className="font-bold text-xs text-blue-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span>🤖</span> AI Intelligence Observations
            </h3>
            <ul className="space-y-1.5 text-xs text-blue-950">
              {caseData.observations.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {onViewNetwork && (
            <button
              onClick={() => onViewNetwork(caseData)}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>🕸️</span> View Criminal Network
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>📄</span> Generate Investigation PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaseSummaryCard;