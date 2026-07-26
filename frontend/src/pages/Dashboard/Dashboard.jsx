import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner.jsx";
import CrimeChart from "../../components/visualization/CrimeChart.jsx";
import CrimeMap from "../../components/visualization/CrimeMap.jsx";
import NetworkGraph from "../../components/visualization/NetworkGraph.jsx";
import ChatContainer from "../../components/chat/ChatContainer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const TABS = [
  { id: "chat",     label: "🤖 AI Assistant" },
  { id: "analytics",label: "📊 Analytics" },
  { id: "map",      label: "📍 Crime Map" },
  { id: "network",  label: "🕸️ Network" },
];

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [firs, setFirs] = useState([]);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("firs") || "[]");
      setFirs(stored);
    } catch { setFirs([]); }
  }, []);

  // When AI returns a graph response, switch to network tab automatically
  const handleGraphResult = (data) => {
    if (data) {
      setGraphData(data);
      setActiveTab("network");
    }
  };

  const totalCases = 1248 + firs.length;
  const activeInv = firs.filter(f =>
    f.status === "Pending Investigation" || f.status === "Under Investigation"
  ).length + 312;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Welcome */}
          <WelcomeBanner />

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Cases"         value={totalCases.toLocaleString()} icon="📋" color="blue" />
            <StatCard title="Active Investigations" value={activeInv.toLocaleString()}  icon="🔍" color="amber" />
            <StatCard title="High-Risk Suspects"  value="48"                          icon="⚠️" color="red" />
            <StatCard title="Resolved Cases"      value="888"                         icon="✅" color="green" />
          </div>

          {/* Tab bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-900 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">

              {/* AI ASSISTANT — full-height prominent chat */}
              {activeTab === "chat" && (
                <ChatContainer onGraphResult={handleGraphResult} />
              )}

              {/* ANALYTICS */}
              {activeTab === "analytics" && (
                <CrimeChart />
              )}

              {/* CRIME MAP */}
              {activeTab === "map" && (
                <CrimeMap />
              )}

              {/* NETWORK GRAPH */}
              {activeTab === "network" && (
                <div>
                  {graphData ? (
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        ✅ Live graph data from AI query
                      </span>
                      <button
                        onClick={() => setGraphData(null)}
                        className="text-xs text-slate-400 hover:text-red-500 font-semibold"
                      >
                        Clear &amp; show sample ✕
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-3">
                      Showing sample graph. Ask the AI about a criminal network to load real data.
                    </p>
                  )}
                  <NetworkGraph
                    nodes={graphData?.nodes}
                    edges={graphData?.edges}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
