import { useState } from "react";
import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  Background,
  Controls,
} from "@xyflow/react";

import OfficerDetailsPanel from "../panel/OfficerDetailsPanel";

const initialNodes = [
  // Tier 1: Main Case
  {
    id: "1",
    position: { x: 300, y: 20 },
    data: { 
      label: "📄 FIR-102 (Vehicle Theft)",
      details: {
        name: "FIR-102/2026",
        role: "Case File",
        status: "Active Investigation",
        summary: "Vehicle Theft at Mysuru Railway Station. Hero Splendor stolen.",
        date: "15 July 2026"
      } 
    },
    style: { background: "#1E3A8A", color: "#fff", fontWeight: "bold", border: "2px solid #1E3A8A", borderRadius: "8px" }
  },
  // Tier 2: Directly Connected Entities
  {
    id: "2",
    position: { x: 80, y: 140 },
    data: {
      label: "🚔 Suspect: Ramesh",
      details: {
        name: "Ramesh",
        age: 29,
        role: "Primary Suspect",
        previousCases: 4,
        status: "Arrested",
        phone: "+91 98765 43210"
      },
    },
    style: { background: "#FEE2E2", color: "#991B1B", fontWeight: "bold", border: "2px solid #EF4444", borderRadius: "8px" }
  },
  {
    id: "3",
    position: { x: 300, y: 140 },
    data: {
      label: "👤 Victim: Ravi Kumar",
      details: {
        name: "Ravi Kumar",
        age: 42,
        role: "Complainant / Victim",
        previousCases: 0,
        status: "Safe",
        statement: "Parked bike at 9:00 PM, missing by 10:30 PM."
      },
    },
    style: { background: "#E0E7FF", color: "#3730A3", border: "1px solid #6366F1", borderRadius: "8px" }
  },
  {
    id: "4",
    position: { x: 520, y: 140 },
    data: {
      label: "👁️ Witness: Anand",
      details: {
        name: "Anand",
        age: 38,
        role: "Eyewitness (Tea Vendor)",
        status: "Verified",
        statement: "Saw two men riding towards Bannimantap Road without helmets."
      },
    },
    style: { background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B", borderRadius: "8px" }
  },
  // Tier 3: Criminal Network / Associates
  {
    id: "5",
    position: { x: 80, y: 260 },
    data: {
      label: "🔗 Associate: Suresh",
      details: {
        name: "Suresh",
        age: 34,
        role: "Accomplice / Fence",
        previousCases: 2,
        status: "Absconding",
        lastKnownLocation: "Mandya"
      },
    },
    style: { background: "#FEE2E2", color: "#991B1B", border: "1px dashed #EF4444", borderRadius: "8px" }
  },
  // Tier 4: Linked Historical FIRs
  {
    id: "6",
    position: { x: 80, y: 380 },
    data: {
      label: "📁 Prior Case: FIR-88/2025",
      details: {
        name: "FIR-88/2025",
        role: "Previous Linked Crime",
        status: "Charge Sheeted",
        summary: "Similar M.O. involving stolen two-wheelers in Mandya Market."
      },
    },
    style: { background: "#F3F4F6", color: "#374151", border: "1px solid #9CA3AF", borderRadius: "8px" }
  }
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true, label: "Accused" },
  { id: "e1-3", source: "1", target: "3", label: "Reported by" },
  { id: "e1-4", source: "1", target: "4", label: "Spotted by" },
  { id: "e2-5", source: "2", target: "5", label: "Known Associate" },
  { id: "e5-6", source: "5", target: "6", label: "Involved in" }
];

function NetworkGraph() {
  const [selectedDetails, setSelectedDetails] = useState({
    name: "FIR-102/2026",
    role: "Primary Case Node",
    status: "Active Investigation",
    summary: "Select any node in the graph to view specific criminal profiles, witness statements, or linked FIR records."
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-5 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🕸️ Interactive Criminal Link Graph
          </h2>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
            Click nodes to inspect details
          </span>
        </div>

        <div style={{ width: "100%", height: "450px" }} className="bg-slate-50 rounded-lg">
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            fitView
            onNodeClick={(event, node) => {
              if (node.data.details) {
                setSelectedDetails(node.data.details);
              }
            }}
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <div className="lg:col-span-1">
        <OfficerDetailsPanel officer={selectedDetails} />
      </div>
    </div>
  );
}

export default NetworkGraph;