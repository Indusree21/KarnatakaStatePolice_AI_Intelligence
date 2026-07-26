import React from "react";

function CaseSummaryCard({ caseData, onViewNetwork }) {
  if (!caseData) return null;

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-md mt-4 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-800 text-white px-5 py-3 flex justify-between items-center">
        <h2 className="text-xl font-semibold">📄 Case Details</h2>
        {caseData.firNumber && (
          <span className="bg-blue-950 text-blue-200 text-xs px-2.5 py-1 rounded-md font-mono">
            {caseData.firNumber}
          </span>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <p className="text-gray-500 text-sm">FIR Number</p>
            <p className="font-semibold text-gray-800">{caseData.firNumber || "N/A"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Crime Type</p>
            <p className="font-semibold text-gray-800">{caseData.crimeType || "N/A"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Location</p>
            <p className="font-semibold text-gray-800">{caseData.location || "N/A"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Date</p>
            <p className="font-semibold text-gray-800">{caseData.date || "N/A"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Status</p>
            <span className="inline-block mt-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
              {caseData.status || "Under Investigation"}
            </span>
          </div>
        </div>

        {/* Summary */}
        {caseData.summary && (
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">📝 Incident Summary</h3>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
              {caseData.summary}
            </p>
          </div>
        )}

        {/* Persons */}
        {caseData.persons && caseData.persons.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">👥 Persons Involved</h3>
            <ul className="space-y-2">
              {caseData.persons.map((person, index) => (
                <li key={index} className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-800 font-medium">
                  {person}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence */}
        {caseData.evidence && caseData.evidence.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">🔍 Evidence Collected</h3>
            <ul className="space-y-2">
              {caseData.evidence.map((item, index) => (
                <li key={index} className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-3 py-2 text-sm font-medium">
                  ✅ {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Observations (Safe render with optional chaining) */}
        {caseData.observations && caseData.observations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 text-blue-900">🤖 AI Observations</h3>
            <ul className="space-y-2 text-sm text-blue-950">
              {caseData.observations.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View Network Button */}
        {onViewNetwork && (
          <button
            onClick={onViewNetwork}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition shadow-md"
          >
            🕸️ View Criminal Network
          </button>
        )}
      </div>
    </div>
  );
}

export default CaseSummaryCard;