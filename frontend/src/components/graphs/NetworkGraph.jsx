import "@xyflow/react/dist/style.css";

import {
  ReactFlow,
  Background,
  Controls,
} from "@xyflow/react";

const nodes = [
  {
    id: "1",
    position: { x: 250, y: 20 },
    data: { label: "FIR-102" },
  },
  {
    id: "2",
    position: { x: 80, y: 150 },
    data: { label: "Suspect A" },
  },
  {
    id: "3",
    position: { x: 420, y: 150 },
    data: { label: "Suspect B" },
  },
  {
    id: "4",
    position: { x: 250, y: 300 },
    data: { label: "Victim" },
  },
];

const edges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
  },
];

function NetworkGraph() {
  return (
    <div className="bg-white rounded-xl shadow-lg mt-6 p-5">

      <h2 className="text-xl font-bold mb-4">
        Criminal Network Analysis
      </h2>

      <div style={{ width: "100%", height: "500px" }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>

    </div>
  );
}

export default NetworkGraph;