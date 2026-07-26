import React, { useState } from "react";

// Interactive crime hotspots in Mysuru
const mysuruIncidents = [
  {
    id: "FIR-102",
    title: "Vehicle Theft - Two Wheeler",
    location: "Mysuru Railway Station Parking",
    time: "15 July 2026, 09:30 PM",
    coords: { top: "38%", left: "45%" },
    status: "Under Investigation",
    summary: "Hero Splendor stolen near ticket counter. CCTV captured two suspects fleeing towards Bannimantap Road.",
  },
  {
    id: "FIR-118",
    title: "Shop Burglary",
    location: "Devaraja Market, Mysuru",
    time: "18 July 2026, 02:15 AM",
    coords: { top: "52%", left: "58%" },
    status: "Suspect Identified",
    summary: "Electronics store broken into. Cash box tampered. Latent fingerprints collected from glass display.",
  },
  {
    id: "FIR-124",
    title: "Chain Snatching",
    location: "Gokulam 3rd Stage, Mysuru",
    time: "21 July 2026, 06:45 PM",
    coords: { top: "28%", left: "68%" },
    status: "Active Alert",
    summary: "Gold chain snatched by two helmeted riders on a black Pulsar. Camera tracking in progress.",
  },
];

function CrimeMap() {
  const [selectedCase, setSelectedCase] = useState(null);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* MAP HEADER */}
      <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            📍 Mysuru Region Geo-Spatial Crime Map
          </h2>
          <p className="text-xs text-slate-300">Click any incident pin to inspect case brief</p>
        </div>
        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
          3 Active Hotspots
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* GEOGRAPHIC VIEW CANVAS */}
        <div className="lg:col-span-2 relative bg-slate-100 h-[450px] p-4 flex items-center justify-center border-r border-gray-200 overflow-hidden">
          {/* Simulated Map Visual Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-slate-700 shadow-sm">
            🗺️ Mysuru District - Active Grid
          </div>

          {/* INCIDENT PINS */}
          {mysuruIncidents.map((incident) => (
            <button
              key={incident.id}
              style={{ top: incident.coords.top, left: incident.coords.left }}
              onClick={() => setSelectedCase(incident)}
              className="absolute group transform -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            >
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75"></span>
                <div className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition scale-100 group-hover:scale-125">
                  🚨
                </div>
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded absolute -bottom-7 whitespace-nowrap left-1/2 -translate-x-1/2 shadow-lg z-10">
                {incident.id}: {incident.title}
              </span>
            </button>
          ))}
        </div>

        {/* INCIDENT DETAILS DRAWER */}
        <div className="lg:col-span-1 p-5 bg-slate-50 flex flex-col justify-between h-[450px] overflow-y-auto">
          {selectedCase ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    {selectedCase.id}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 mt-1">{selectedCase.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Location</p>
                <p className="text-sm font-medium text-gray-800">{selectedCase.location}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Reported Time</p>
                <p className="text-sm font-medium text-gray-800">{selectedCase.time}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
                <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-md font-semibold">
                  {selectedCase.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Incident Brief</p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 mt-1 leading-relaxed">
                  {selectedCase.summary}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <span className="text-4xl mb-2">📍</span>
              <p className="text-sm font-medium">Click on any map marker pin to view incident details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CrimeMap;