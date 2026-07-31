import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner.jsx";
import CrimeChart from "../../components/visualization/CrimeChart.jsx";
import CrimeMap from "../../components/visualization/CrimeMap.jsx";
import NetworkGraph from "../../components/visualization/NetworkGraph.jsx";
import CaseSummaryCard from "../../components/chat/CaseSummaryCard.jsx";
import ChatContainer from "../../components/chat/ChatContainer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { MOCK_CASES } from "../../services/caseService.js";

const TABS = [
  { id: "chat",     label: "🤖 AI Assistant" },
  { id: "summary",  label: "📄 Case Summary" },
  { id: "network",  label: "🕸️ Criminal Network" },
  { id: "map",      label: "📍 Crime Map" },
  { id: "analytics",label: "📊 Analytics" },
];

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [firs, setFirs] = useState([]);
  
  // Selected case & network graph state
  const [selectedCase, setSelectedCase] = useState(MOCK_CASES[0]);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("firs") || "[]");
      setFirs(stored);
    } catch {
      setFirs([]);
    }
  }, []);

  // Navigation handlers triggered from AI chat or Crime Map
  const handleViewCaseDetails = (caseObj) => {
    if (caseObj) {
      setSelectedCase(caseObj);
      setActiveTab("summary");
    }
  };

  const handleViewNetwork = (caseObj) => {
    const c = caseObj || selectedCase || MOCK_CASES[0];
    setSelectedCase(c);
    if (c.networkNodes && c.networkEdges) {
      setGraphData({ nodes: c.networkNodes, edges: c.networkEdges });
    }
    setActiveTab("network");
  };

  const handleViewMap = () => {
    setActiveTab("map");
  };

  const totalCases = 1248 + firs.length;
  const activeInv = firs.filter(f =>
    f.status === "Pending Investigation" || f.status === "Under Investigation"
  ).length + 312;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Welcome banner */}
          <WelcomeBanner />

          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Cases"         value={totalCases.toLocaleString()} icon="📋" color="blue" />
            <StatCard title="Active Investigations" value={activeInv.toLocaleString()}  icon="🔍" color="amber" />
            <StatCard title="High-Risk Suspects"  value="48"                          icon="⚠️" color="red" />
            <StatCard title="Resolved Cases"      value="888"                         icon="✅" color="green" />
          </div>

          {/* Main Tabbed Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[130px] py-3.5 px-4 text-xs font-bold transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "bg-white text-blue-900 border-blue-900 shadow-2xs"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Views */}
            <div className="p-5">
              {/* 1. AI ASSISTANT TAB */}
              {activeTab === "chat" && (
                <ChatContainer
                  onViewCaseDetails={handleViewCaseDetails}
                  onViewNetwork={handleViewNetwork}
                  onViewMap={handleViewMap}
                />
              )}

              {/* 2. CASE SUMMARY TAB */}
              {activeTab === "summary" && (
                <div>
                  <div className="mb-4 flex flex-wrap justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Active Case File:</span>
                      <select
                        value={selectedCase?.firNumber || "FIR-102"}
                        onChange={(e) => {
                          const found = MOCK_CASES.find(c => c.firNumber === e.target.value);
                          if (found) setSelectedCase(found);
                        }}
                        className="bg-white border border-slate-300 font-mono font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none shadow-2xs"
                      >
                        {MOCK_CASES.map(c => (
                          <option key={c.firNumber} value={c.firNumber}>
                            {c.firNumber} — {c.crimeType}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      Showing complete intelligence profile
                    </span>
                  </div>

                  <CaseSummaryCard
                    caseData={selectedCase}
                    onViewNetwork={() => handleViewNetwork(selectedCase)}
                  />
                </div>
              )}

              {/* 3. CRIMINAL NETWORK TAB */}
              {activeTab === "network" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Network Graph Context: {selectedCase?.firNumber || "FIR-102"}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Multi-tiered topology showing Suspects, Victims, Witnesses, Associates &amp; Linked FIRs
                      </p>
                    </div>

                    {graphData && (
                      <button
                        onClick={() => setGraphData(null)}
                        className="text-xs text-slate-500 hover:text-red-600 font-semibold bg-white border border-slate-200 px-3 py-1 rounded-lg"
                      >
                        Reset Graph View
                      </button>
                    )}
                  </div>

                  <NetworkGraph
                    nodes={graphData?.nodes || selectedCase?.networkNodes}
                    edges={graphData?.edges || selectedCase?.networkEdges}
                    caseData={selectedCase}
                  />
                </div>
              )}

              {/* 4. CRIME MAP TAB */}
              {activeTab === "map" && (
                <CrimeMap
                  onSelectFullCase={(caseObj) => {
                    const match = MOCK_CASES.find(c => c.firNumber === caseObj.id) || {
                      firNumber: caseObj.id,
                      crimeType: caseObj.title,
                      date: caseObj.date || caseObj.time,
                      location: caseObj.location,
                      victim: "Victim statement recorded",
                      suspects: ["Suspect under tracking"],
                      evidence: ["Incident brief recorded"],
                      observations: [caseObj.summary],
                      status: caseObj.status,
                      summary: caseObj.summary,
                    };
                    handleViewCaseDetails(match);
                  }}
                />
              )}

              {/* 5. ANALYTICS TAB */}
              {activeTab === "analytics" && (
                <CrimeChart />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
