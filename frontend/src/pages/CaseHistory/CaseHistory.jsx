import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_COLORS = {
  "Pending Investigation": "bg-amber-100 text-amber-800",
  "Under Investigation":   "bg-blue-100 text-blue-800",
  "Under Active Investigation": "bg-blue-100 text-blue-800",
  "Charge Sheeted":        "bg-emerald-100 text-emerald-800",
  "Closed":                "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS = {
  Low:              "bg-slate-100 text-slate-600",
  Medium:           "bg-yellow-100 text-yellow-700",
  High:             "bg-orange-100 text-orange-700",
  "Critical Threat":"bg-red-100 text-red-700",
};

function CaseHistory() {
  const { user } = useAuth();
  const [firs, setFirs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("firs") || "[]");
      setFirs(stored);
    } catch {
      setFirs([]);
    }
  }, []);

  const filtered = firs.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.firNumber?.toLowerCase().includes(q) ||
      f.complainantName?.toLowerCase().includes(q) ||
      f.incidentType?.toLowerCase().includes(q) ||
      f.location?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q);
    const matchPriority = filterPriority === "All" || f.priority === filterPriority;
    const matchStatus   = filterStatus   === "All" || f.status   === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  const handleDelete = (firNumber) => {
    if (!window.confirm(`Delete ${firNumber}? This cannot be undone.`)) return;
    const updated = firs.filter((f) => f.firNumber !== firNumber);
    localStorage.setItem("firs", JSON.stringify(updated));
    setFirs(updated);
    if (selected?.firNumber === firNumber) setSelected(null);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        <main className="p-6 space-y-5 max-w-7xl w-full mx-auto">

          {/* Page heading */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                📁 Registered Case Records
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {firs.length} FIR{firs.length !== 1 ? "s" : ""} on record — {user?.station || "Station"}
              </p>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200">
              {user?.role || "INSPECTOR"}
            </span>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search FIR number, name, type, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical Threat</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option>Pending Investigation</option>
              <option>Under Investigation</option>
              <option>Charge Sheeted</option>
              <option>Closed</option>
            </select>
            {(search || filterPriority !== "All" || filterStatus !== "All") && (
              <button
                onClick={() => { setSearch(""); setFilterPriority("All"); setFilterStatus("All"); }}
                className="text-xs text-slate-500 hover:text-red-600 font-semibold"
              >
                ✕ Clear filters
              </button>
            )}
          </div>

          {firs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">📂</p>
              <p className="font-semibold text-slate-600">No FIRs registered yet.</p>
              <p className="text-sm mt-1">Use "Register FIR" in the sidebar to file a new case.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No records match your search or filters.</p>
            </div>
          ) : (
            <div className={`grid gap-5 ${selected ? "lg:grid-cols-2" : "grid-cols-1"}`}>
              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["FIR No.", "Complainant", "Category", "Station", "Date", "Priority", "Status", ""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((fir) => (
                        <tr
                          key={fir.firNumber}
                          onClick={() => setSelected(selected?.firNumber === fir.firNumber ? null : fir)}
                          className={`cursor-pointer transition-colors ${
                            selected?.firNumber === fir.firNumber
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {fir.firNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                            {fir.complainantName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {fir.incidentType}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {fir.location}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {fir.incidentDate}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[fir.priority] || "bg-slate-100 text-slate-600"}`}>
                              {fir.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[fir.status] || "bg-slate-100 text-slate-600"}`}>
                              {fir.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(fir.firNumber); }}
                              className="text-slate-300 hover:text-red-500 transition text-base"
                              title="Delete FIR"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                  Showing {filtered.length} of {firs.length} records
                </div>
              </div>

              {/* Detail panel */}
              {selected && (
                <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 space-y-4 self-start">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                        {selected.firNumber}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">{selected.incidentType}</h3>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                  </div>

                  {[
                    ["Complainant", selected.complainantName],
                    ["Contact", selected.contactNumber],
                    ["Station", selected.location],
                    ["Date & Time", `${selected.incidentDate} at ${selected.incidentTime}`],
                    ["Registered On", selected.registeredAt],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 font-semibold uppercase">{label}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{val || "—"}</p>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[selected.priority]}`}>
                      {selected.priority}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[selected.status]}`}>
                      {selected.status}
                    </span>
                  </div>

                  {selected.description && (
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Description</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        {selected.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CaseHistory;
