import React, { useState, useEffect } from "react";

// Layout components
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";

// Dashboard components
import StatCard from "../../components/dashboard/StatCard.jsx";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner.jsx";

// Visualization components
import CrimeChart from "../../components/visualization/CrimeChart.jsx";
import CrimeMap from "../../components/visualization/CrimeMap.jsx";
import NetworkGraph from "../../components/visualization/NetworkGraph.jsx";

// Chat Assistant
import ChatContainer from "../../components/chat/ChatContainer.jsx";

// Page Views
import NewFIR from "../NewFIR/NewFIR.jsx";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [firs, setFirs] = useState([]);
  
  // Active query state triggered by user search OR AI Assistant interaction
  const [activeQuery, setActiveQuery] = useState("");
  const [activeVisualization, setActiveVisualization] = useState("none"); // "none" | "fir_network" | "location_trends"

  // Load registered FIRs from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("firs") || "[]");
      setFirs(stored);
    } catch (err) {
      console.error("Failed to parse FIR data:", err);
    }
  }, [activeTab]);

  // Handler for AI Chat or Search input to trigger corresponding visual
  const handleQueryTrigger = (query) => {
    setActiveQuery(query);
    const qLower = query.toLowerCase();

    if (qLower.includes("fir") || qLower.includes("suspect") || qLower.includes("network")) {
      setActiveVisualization("fir_network");
    } else if (
      qLower.includes("theft") ||
      qLower.includes("cases") ||
      qLower.includes("mysuru") ||
      qLower.includes("map") ||
      qLower.includes("trend") ||
      qLower.includes("crime")
    ) {
      setActiveVisualization("location_trends");
    } else {
      setActiveVisualization("none");
    }
  };

  const totalCases = 1248 + firs.length;
  const activeInvestigations =
    firs.filter(
      (f) =>
        f.status === "Pending Investigation" ||
        f.status === "Under Investigation"
    ).length + 312;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />

        <main className="p-6 space-y-6">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <>
              <WelcomeBanner />

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Cases" value={totalCases.toLocaleString()} />
                <StatCard
                  title="Active Investigations"
                  value={activeInvestigations.toLocaleString()}
                />
                <StatCard title="High-Risk Suspects" value="48" />
                <StatCard title="Resolved Cases" value="888" />
              </div>

              {/* Main Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left/Main Column: Visualizations load HERE on top when triggered */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Default State: Display direct shortcut buttons to quickly load graphs */}
                  {activeVisualization === "none" && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">AI-Driven Workspace</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                          Ask the AI Assistant on the right about specific FIRs or location crime trends to display visual analytics here.
                        </p>
                      </div>

                      {/* Manual Quick Action Chips */}
                      <div className="pt-2 flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => handleQueryTrigger("theft cases in mysuru")}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
                        >
                          📍 Show Theft Hotspots & Trends
                        </button>
                        <button
                          onClick={() => handleQueryTrigger("FIR-202 criminal network")}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
                        >
                          🕸️ View Criminal Network Graph
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VISUALIZATION 1: Criminal Network Graph (When asking about specific FIR/Suspects) */}
                  {activeVisualization === "fir_network" && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                          <h3 className="font-bold text-slate-800 text-sm">
                            Suspect Network & Associate Mapping
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveVisualization("none")}
                          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                        >
                          Close View ✕
                        </button>
                      </div>
                      <NetworkGraph />
                    </div>
                  )}

                  {/* VISUALIZATION 2: Location Hotspot Map & Trend Charts (When asking about theft/area cases) */}
                  {activeVisualization === "location_trends" && (
                    <div className="space-y-6">
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                            Geographic Hotspot Map {activeQuery ? `— "${activeQuery}"` : ""}
                          </h3>
                          <button
                            onClick={() => setActiveVisualization("none")}
                            className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                          >
                            Close View ✕
                          </button>
                        </div>
                        <CrimeMap />
                      </div>

                      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
                        <h3 className="font-bold text-slate-800 text-sm pb-3 border-b border-slate-100">
                          Incident Trends & Frequency Analysis
                        </h3>
                        <CrimeChart />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: AI Assistant (Pass handleQueryTrigger down) */}
                <div className="lg:col-span-1">
                  <ChatContainer onQuerySubmit={handleQueryTrigger} />
                </div>

              </div>
            </>
          )}

          {/* REGISTER NEW FIR TAB */}
          {activeTab === "fir" && <NewFIR />}

          {/* CASE HISTORY TAB */}
          {activeTab === "cases" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-xl font-bold text-slate-800">📁 Registered Case Records</h2>
              {/* Table logic remains unchanged */}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2">📈 Intelligence Reports</h2>
              <p className="text-slate-600 text-sm">Download aggregated crime trend reports and officer activity summaries.</p>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2">⚙️ System Settings</h2>
              <p className="text-slate-600 text-sm">Manage API keys, user access permissions, and system preferences.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;