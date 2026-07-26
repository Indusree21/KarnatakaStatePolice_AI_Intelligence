import { useState, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";

// ─── Node style map (matches backend "type" field) ───────────────────────────
const NODE_STYLES = {
  case: {
    background: "#1E3A8A",
    color: "#fff",
    border: "2px solid #1E3A8A",
    borderRadius: "10px",
    fontWeight: "bold",
    padding: "8px 12px",
    fontSize: "11px",
  },
  accused: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "2px solid #EF4444",
    borderRadius: "10px",
    fontWeight: "bold",
    padding: "8px 12px",
    fontSize: "11px",
  },
  victim: {
    background: "#DBEAFE",
    color: "#1E40AF",
    border: "2px solid #3B82F6",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "11px",
  },
  complainant: {
    background: "#FEF9C3",
    color: "#854D0E",
    border: "2px solid #EAB308",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "11px",
  },
  linked_case: {
    background: "#F3F4F6",
    color: "#374151",
    border: "1px dashed #9CA3AF",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "11px",
  },
};

const FALLBACK_STYLE = {
  background: "#F9FAFB",
  color: "#374151",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "8px 12px",
  fontSize: "11px",
};

// ─── Layout: arrange nodes in tiers by type ──────────────────────────────────
function computeLayout(nodes) {
  const tiers = {
    case:        { y: 20,  nodes: [] },
    accused:     { y: 180, nodes: [] },
    victim:      { y: 180, nodes: [] },
    complainant: { y: 340, nodes: [] },
    linked_case: { y: 340, nodes: [] },
  };

  // Bucket by type
  nodes.forEach(n => {
    const tier = tiers[n.type] ?? tiers.linked_case;
    tier.nodes.push(n);
  });

  // Assign positions
  const positioned = {};
  Object.values(tiers).forEach(tier => {
    const count = tier.nodes.length;
    tier.nodes.forEach((n, i) => {
      const spacing = Math.max(180, 700 / (count + 1));
      positioned[n.id] = {
        x: spacing * (i + 1) - spacing / 2,
        y: tier.y,
      };
    });
  });
  return positioned;
}

// ─── Convert backend nodes → ReactFlow nodes ─────────────────────────────────
function toFlowNodes(nodes = []) {
  const positions = computeLayout(nodes);
  return nodes.map(n => ({
    id:       String(n.id),
    position: positions[n.id] ?? { x: Math.random() * 600, y: Math.random() * 400 },
    data:     { label: n.label ?? n.id, meta: n.meta ?? n },
    style:    NODE_STYLES[n.type] ?? FALLBACK_STYLE,
  }));
}

// ─── Convert backend edges → ReactFlow edges ─────────────────────────────────
function toFlowEdges(edges = []) {
  return edges.map((e, i) => ({
    id:           e.id ?? `edge-${i}`,
    source:       String(e.source ?? e.from),
    target:       String(e.target ?? e.to),
    label:        e.label ?? "",
    animated:     e.source?.startsWith("acc") && e.target?.startsWith("case"),
    style:        { stroke: "#94A3B8", strokeWidth: 1.5 },
    labelStyle:   { fontSize: 10, fill: "#64748B" },
    labelBgStyle: { fill: "#F8FAFC", fillOpacity: 0.8 },
  }));
}

// ─── Legend chip ─────────────────────────────────────────────────────────────
function LegendChip({ color, border, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm inline-block shrink-0"
        style={{ background: color, border: `1.5px solid ${border}` }}
      />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ meta }) {
  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6">
        <span className="text-4xl mb-3">🔍</span>
        <p className="text-sm font-medium">Click any node to view details</p>
      </div>
    );
  }

  const TYPE_ICONS = {
    case:        "📋",
    accused:     "🚔",
    victim:      "👤",
    complainant: "📝",
    linked_case: "📁",
  };

  const icon  = TYPE_ICONS[meta.type] ?? "🔵";
  const title = meta.name || meta.CrimeNo || `Case #${meta.CaseMasterID}` || "Details";

  const fields = Object.entries(meta).filter(
    ([k]) => !["type", "name"].includes(k) && meta[k]
  );

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className="text-[11px] text-slate-400 capitalize">{meta.type?.replace("_", " ") ?? "Node"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {fields.map(([key, val]) => (
          <div key={key}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed break-words">
              {String(val).slice(0, 300)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Demo fallback data ───────────────────────────────────────────────────────
const DEMO_NODES = [
  { id: "case_1",  label: "📋 Case #1\nVehicle Theft",   type: "case",        meta: { type: "case", CaseMasterID: 1, CrimeType: "Vehicle Theft", role: "Case" } },
  { id: "acc_1",   label: "🚔 Accused A\n(Age 28)",       type: "accused",     meta: { type: "accused", name: "Accused A", age: 28, role: "Accused" } },
  { id: "acc_2",   label: "🚔 Accused B\n(Age 34)",       type: "accused",     meta: { type: "accused", name: "Accused B", age: 34, role: "Accused" } },
  { id: "vic_1",   label: "👤 Victim A\n(Age 45)",        type: "victim",      meta: { type: "victim",  name: "Victim A",  age: 45, role: "Victim" } },
  { id: "comp_1",  label: "📝 Complainant A",             type: "complainant", meta: { type: "complainant", name: "Complainant A", role: "Complainant" } },
];
const DEMO_EDGES = [
  { id: "e1", source: "acc_1",  target: "case_1", label: "Accused in" },
  { id: "e2", source: "acc_2",  target: "case_1", label: "Accused in" },
  { id: "e3", source: "vic_1",  target: "case_1", label: "Victim in" },
  { id: "e4", source: "comp_1", target: "case_1", label: "Filed complaint" },
];

// ─── Main component ───────────────────────────────────────────────────────────
function NetworkGraph({ nodes, edges }) {
  const [selectedMeta, setSelectedMeta] = useState(null);
  const isDemo = !nodes?.length;

  const flowNodes = useMemo(() => toFlowNodes(isDemo ? DEMO_NODES : nodes), [nodes, isDemo]);
  const flowEdges = useMemo(() => toFlowEdges(isDemo ? DEMO_EDGES : edges), [edges, isDemo]);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <LegendChip color="#1E3A8A" border="#1E3A8A"  label="Case" />
        <LegendChip color="#FEE2E2" border="#EF4444"  label="Accused" />
        <LegendChip color="#DBEAFE" border="#3B82F6"  label="Victim" />
        <LegendChip color="#FEF9C3" border="#EAB308"  label="Complainant" />
        <LegendChip color="#F3F4F6" border="#9CA3AF"  label="Linked Case" />
        {isDemo && (
          <span className="ml-auto text-[11px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
            Sample — ask "show network for case 1" to load real data
          </span>
        )}
      </div>

      {/* Graph + Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ReactFlow canvas */}
        <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
             style={{ height: "480px" }}>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            onNodeClick={(_e, node) => setSelectedMeta(node.data.meta ?? null)}
          >
            <Background color="#CBD5E1" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={n => {
                const type = n.data?.meta?.type ?? "";
                return type === "accused" ? "#EF4444"
                  : type === "victim"      ? "#3B82F6"
                  : type === "case"        ? "#1E3A8A"
                  : "#9CA3AF";
              }}
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            />
          </ReactFlow>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm"
             style={{ height: "480px" }}>
          <div className="bg-slate-800 text-white px-4 py-2.5 rounded-t-xl">
            <p className="text-xs font-bold uppercase tracking-wide">Node Details</p>
          </div>
          <DetailPanel meta={selectedMeta} />
        </div>
      </div>
    </div>
  );
}

export default NetworkGraph;
