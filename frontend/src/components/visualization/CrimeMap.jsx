import React, { useEffect, useState } from "react";
import { fetchActiveCases } from "../../services/api";

function CrimeMap({ onSelectFullCase }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchActiveCases("Mysuru")
      .then((data) => {
        if (!isMounted) return;
        setCases(data.cases || []);
        setSelectedCase(data.cases?.[0] || null);
      })
      .catch((error) => {
        if (isMounted) setLoadError(error.message || "Unable to load active cases.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const incidents = filterType === "all"
    ? cases
    : cases.filter(c => c.status.toLowerCase().includes(filterType));

  const latitudes = cases.map(c => c.latitude);
  const longitudes = cases.map(c => c.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const markerPosition = (incident) => ({
    top: `${maxLat === minLat ? 50 : 88 - ((incident.latitude - minLat) / (maxLat - minLat)) * 72}%`,
    left: `${maxLng === minLng ? 50 : 12 + ((incident.longitude - minLng) / (maxLng - minLng)) * 76}%`,
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Map Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            📍 Mysuru District Geo-Spatial Crime Map
          </h2>
          <p className="text-xs text-slate-300">
            Click any marker pin to inspect incident details &amp; launch full case investigation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 font-semibold focus:outline-none"
          >
            <option value="all">All Statuses ({cases.length})</option>
            <option value="investigation">Under Investigation</option>
            <option value="alert">Active Alert</option>
            <option value="suspect">Suspect Identified</option>
          </select>
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shrink-0">
            {incidents.length} Active Pins
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Interactive Visual Map Canvas */}
        <div className="lg:col-span-2 relative bg-slate-100 h-[500px] p-4 flex items-center justify-center border-r border-slate-200 overflow-hidden">
          {/* Simulated Map Visual Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-60"></div>
          
          {/* City Landmark Labels */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-2 z-10">
            <span>🗺️ Mysuru Urban Police Zone</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white text-[10px] px-3 py-1.5 rounded-lg backdrop-blur font-mono border border-slate-700 shadow-md">
            GPS Center: 12.3112° N, 76.6530° E
          </div>

          {isLoading && (
            <div className="relative z-10 bg-white/95 rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 shadow-md">
              Loading active cases for Mysuru...
            </div>
          )}
          {!isLoading && loadError && (
            <div className="relative z-10 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm font-semibold text-red-700 shadow-md">
              {loadError}
            </div>
          )}
          {!isLoading && !loadError && incidents.length === 0 && (
            <div className="relative z-10 bg-white/95 rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 shadow-md">
              No active geolocated cases found in Mysuru.
            </div>
          )}

          {incidents.map((incident) => {
            const isSelected = selectedCase?.case_id === incident.case_id;
            return (
              <button
                key={incident.case_id}
                style={markerPosition(incident)}
                onClick={() => setSelectedCase(incident)}
                className={`absolute group transform -translate-x-1/2 -translate-y-1/2 focus:outline-none transition-all ${
                  isSelected ? "z-30 scale-125" : "z-20 scale-100 hover:scale-115"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-75 ${
                    isSelected ? "bg-blue-400" : "bg-red-400"
                  }`}></span>
                  <div className={`p-2 rounded-full shadow-xl border-2 transition flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? "bg-blue-700 border-yellow-300 text-white shadow-blue-500/50"
                      : "bg-red-600 border-white text-white shadow-red-500/50"
                  }`}>
                    📍
                  </div>
                </div>

                {/* Marker Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-md absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-xl z-40 border border-slate-700 font-medium pointer-events-none">
                  <span className="font-bold text-yellow-300">{incident.fir_number}</span>: {incident.location.split(",")[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Crime Details Drawer / Sidebar */}
        <div className="lg:col-span-1 p-5 bg-slate-50 flex flex-col justify-between h-[500px] overflow-y-auto">
          {selectedCase ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                    {selectedCase.fir_number}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                    {selectedCase.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-white p-1 rounded-lg border border-slate-200"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Location</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedCase.location}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reported Date</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedCase.date}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Investigation Status</p>
                <span className="inline-block mt-1 bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {selectedCase.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Incident Brief</p>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mt-1 leading-relaxed shadow-xs">
                  {selectedCase.summary}
                </p>
              </div>

              {/* View Full Case Trigger Button */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => onSelectFullCase?.(selectedCase)}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>🔍</span> View Full Case Brief &amp; Network
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <span className="text-4xl">📍</span>
              <p className="text-xs font-semibold text-slate-600">Select any marker pin on the map</p>
              <p className="text-[11px] text-slate-400">Click a marker to view crime details &amp; full investigation file</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CrimeMap;