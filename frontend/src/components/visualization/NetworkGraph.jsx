import { useState, useMemo, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlow, Background, Controls, MiniMap, MarkerType } from "@xyflow/react";
import { generateCasePDF } from "../../utils/pdfGenerator";
import { MOCK_CASES, MYSURU_15_THEFT_CASES, getNetworkGraphForQuery } from "../../services/caseService";

// ─── Node style palette ──────────────────────────────────────────────────────
const NODE_STYLES = {
  case: {
    background: "#1E3A8A",
    color: "#ffffff",
    border: "2px solid #1E3A8A",
    borderRadius: "12px",
    fontWeight: "bold",
    padding: "10px 14px",
    fontSize: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  accused: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "2px solid #EF4444",
    borderRadius: "12px",
    fontWeight: "bold",
    padding: "10px 14px",
    fontSize: "11px",
  },
  victim: {
    background: "#DBEAFE",
    color: "#1E40AF",
    border: "2px solid #3B82F6",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "11px",
  },
  witness: {
    background: "#FEF9C3",
    color: "#854D0E",
    border: "2px solid #EAB308",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "11px",
  },
  associate: {
    background: "#F3E8FF",
    color: "#6B21A8",
    border: "2px solid #A855F7",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "11px",
  },
  linked_case: {
    background: "#F1F5F9",
    color: "#334155",
    border: "2px dashed #64748B",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "11px",
  },
  location: {
    background: "#DCFCE7",
    color: "#166534",
    border: "2px solid #22C55E",
    borderRadius: "12px",
    padding: "8px 10px",
    fontSize: "11px",
  },
  evidence: {
    background: "#FEF3C7",
    color: "#92400E",
    border: "2px solid #F59E0B",
    borderRadius: "12px",
    padding: "8px 10px",
    fontSize: "11px",
  },
  fraud_link: {
    background: "#FCE7F3",
    color: "#9D174D",
    border: "2px solid #EC4899",
    borderRadius: "12px",
    padding: "8px 10px",
    fontSize: "11px",
  },
  phone: {
    background: "#E0F2FE",
    color: "#075985",
    border: "2px solid #0EA5E9",
    borderRadius: "12px",
    padding: "8px 10px",
    fontSize: "11px",
  },
  bank_account: {
    background: "#FEF3C7",
    color: "#92400E",
    border: "2px solid #F59E0B",
    borderRadius: "12px",
    padding: "8px 10px",
    fontSize: "11px",
  },
};

const FALLBACK_STYLE = {
  background: "#F8FAFC",
  color: "#334155",
  border: "1px solid #CBD5E1",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "11px",
};

// ─── Layout algorithm for hierarchical multi-tier tree ──────────────────────
function computeLayout(nodes) {
  const isCyberFraud = nodes.some(n => ["fraud_link", "phone", "bank_account"].includes(n.type));
  if (isCyberFraud) {
    const rows = [
      { types: ["case"], y: 24 },
      { types: ["victim", "fraud_link"], y: 150 },
      { types: ["phone"], y: 285 },
      { types: ["bank_account"], y: 420 },
      { types: ["linked_case"], y: 555 },
    ];
    const positioned = {};
    rows.forEach(({ types, y }) => {
      const rowNodes = nodes.filter(n => types.includes(n.type));
      const nodeWidth = 180;
      const gap = 36;
      const rowWidth = rowNodes.length * nodeWidth + Math.max(0, rowNodes.length - 1) * gap;
      const startX = Math.max(20, (760 - rowWidth) / 2);
      rowNodes.forEach((node, index) => {
        positioned[node.id] = { x: startX + index * (nodeWidth + gap), y };
      });
    });
    return positioned;
  }

  const tiers = {
    case:     { y: 24,  nodes: [] },
    context:  { y: 150, nodes: [] },
    people:   { y: 285, nodes: [] },
    evidence: { y: 420, nodes: [] },
  };

  nodes.forEach(n => {
    const tierKey = n.type === "case"
      ? "case"
      : ["victim", "location", "summary"].includes(n.type)
        ? "context"
        : ["accused", "witness", "associate"].includes(n.type)
          ? "people"
          : "evidence";
    tiers[tierKey].nodes.push(n);
  });

  const positioned = {};
  Object.values(tiers).forEach(tier => {
    const count = tier.nodes.length;
    const nodeWidth = tier === tiers.case ? 190 : 156;
    const gap = 26;
    const rowWidth = count * nodeWidth + Math.max(0, count - 1) * gap;
    const startX = Math.max(12, (760 - rowWidth) / 2);
    tier.nodes.forEach((n, i) => {
      positioned[n.id] = {
        x: startX + i * (nodeWidth + gap),
        y: tier.y,
      };
    });
  });
  return positioned;
}

function toFlowNodes(nodes = []) {
  const positions = computeLayout(nodes);
  return nodes.map(n => ({
    id:       String(n.id),
    position: positions[n.id] ?? { x: Math.random() * 500, y: Math.random() * 300 },
    data:     { label: n.label ?? n.id, meta: { ...(n.meta ?? n), type: n.type } },
    style:    {
      ...(NODE_STYLES[n.type] ?? FALLBACK_STYLE),
      width: ["case", "fraud_link", "phone", "bank_account", "linked_case"].includes(n.type) ? 180 : 156,
      minHeight: 54,
      whiteSpace: "pre-wrap",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  }));
}

function toFlowEdges(edges = []) {
  return edges.map((e, i) => ({
    id:           e.id ?? `edge-${i}`,
    source:       String(e.source ?? e.from),
    target:       String(e.target ?? e.to),
    label:        e.label ?? "",
    animated:     e.source?.includes("sus") || e.source?.includes("assoc"),
    style:        { stroke: "#64748B", strokeWidth: 2 },
    markerEnd:    { type: MarkerType.ArrowClosed, color: "#64748B" },
    labelStyle:   { fontSize: 10, fill: "#475569", fontWeight: "600" },
    labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.9 },
  }));
}

// ─── Legend Chip ─────────────────────────────────────────────────────────────
function LegendChip({ color, border, label }) {
  return (
    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
      <span
        className="w-3 h-3 rounded-xs inline-block shrink-0"
        style={{ background: color, border: `1.5px solid ${border}` }}
      />
      <span className="text-[11px] font-semibold text-slate-700">{label}</span>
    </div>
  );
}

// ─── Node Details Panel ──────────────────────────────────────────────────────
function DetailPanel({ meta, onGeneratePDF }) {
  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6 space-y-2">
        <span className="text-4xl">🔍</span>
        <p className="text-xs font-semibold text-slate-600">Click any node in the graph</p>
        <p className="text-[11px] text-slate-400">Select FIR, Suspect, Victim, Witness, or Associate to inspect details</p>
      </div>
    );
  }

  const TYPE_ICONS = {
    case:        "📋",
    accused:     "🚔",
    victim:      "👤",
    witness:     "👁️",
    associate:   "🔗",
    linked_case: "📁",
    location:    "📍",
    evidence:    "🔎",
    fraud_link:  "🔗",
    phone:       "📱",
    bank_account:"🏦",
  };

  const icon = TYPE_ICONS[meta.type] ?? "🔵";
  const title = meta.name || meta.FIR || meta.label || "Details";

  const fields = Object.entries(meta).filter(
    ([k]) => !["type", "name", "label", "networkNodes", "networkEdges"].includes(k) && meta[k]
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full flex flex-col justify-between">
      <div className="space-y-3">
        {/* Node Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-200">
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
              {meta.role || meta.type?.replace("_", " ") || "Entity"}
            </span>
          </div>
        </div>

        {/* Node Attributes */}
        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          {fields.map(([key, val]) => (
            <div key={key} className="border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className="text-xs font-medium text-slate-800 break-words mt-0.5 block">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Export Button */}
      <button
        onClick={onGeneratePDF}
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
      >
        <span>📄</span> Generate PDF for Case
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function NetworkGraph({ nodes: initialNodes, edges: initialEdges, caseData: initialCaseData }) {
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCase, setCurrentCase] = useState(initialCaseData || MOCK_CASES[0]);
  const [activeNodes, setActiveNodes] = useState(initialNodes || MOCK_CASES[0].networkNodes);
  const [activeEdges, setActiveEdges] = useState(initialEdges || MOCK_CASES[0].networkEdges);

  // Sync when props change from external tabs
  useEffect(() => {
    if (initialCaseData) {
      setCurrentCase(initialCaseData);
      const res = getNetworkGraphForQuery(initialCaseData.firNumber || initialCaseData.id);
      setActiveNodes(res.nodes);
      setActiveEdges(res.edges);
      setSelectedMeta(null);
    }
  }, [initialCaseData]);

  // Execute Network Search
  const handleSearchNetwork = (query) => {
    const q = query || searchQuery;
    if (!q.trim()) return;

    const result = getNetworkGraphForQuery(q);
    if (result) {
      setCurrentCase(result.caseData);
      setActiveNodes(result.nodes);
      setActiveEdges(result.edges);
      setSelectedMeta(null);
    }
  };

  const flowNodes = useMemo(() => toFlowNodes(activeNodes), [activeNodes]);
  const flowEdges = useMemo(() => toFlowEdges(activeEdges), [activeEdges]);

  // Combine list of all FIRs for quick dropdown selector
  const allFirs = Array.from(new Set([
    ...MOCK_CASES.map(c => c.firNumber),
    ...MYSURU_15_THEFT_CASES.map(c => c.id).filter(Boolean),
  ]));

  return (
    <div className="space-y-3">
      {/* SEARCH BAR FOR CRIMINAL NETWORK */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <span className="text-base">🔎</span>
          <input
            type="text"
            placeholder="Search FIR (e.g. FIR-105, FIR-124, FIR-145) or suspect name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchNetwork()}
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 placeholder-slate-400 font-medium"
          />
          <button
            onClick={() => handleSearchNetwork()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
          >
            Search Network
          </button>
        </div>

        {/* FIR Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Quick Select:</span>
          <select
            value={currentCase?.firNumber || currentCase?.id || "FIR-102"}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearchNetwork(e.target.value);
            }}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            {allFirs.map(fir => (
              <option key={fir} value={fir}>{fir}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Network Title & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/90 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 bg-white border border-slate-300 px-3 py-1 rounded-lg font-mono">
            🕸️ Network Graph: {currentCase?.firNumber || currentCase?.id || "FIR-102"}
          </span>
          <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">
            ({currentCase?.crimeType || currentCase?.title})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LegendChip color="#1E3A8A" border="#1E3A8A" label="FIR Case" />
          <LegendChip color="#DBEAFE" border="#3B82F6" label="Victim" />
          {currentCase?.source === "local_fir" && currentCase?.crimeType?.toLowerCase().includes("fraud") ? (
            <>
              <LegendChip color="#FCE7F3" border="#EC4899" label="Fraud Link" />
              <LegendChip color="#E0F2FE" border="#0EA5E9" label="Phone" />
              <LegendChip color="#FEF3C7" border="#F59E0B" label="Bank Account" />
              <LegendChip color="#F1F5F9" border="#64748B" label="Linked Case" />
            </>
          ) : currentCase?.source === "local_fir" ? (
            <>
              <LegendChip color="#FEE2E2" border="#EF4444" label="Suspect" />
              <LegendChip color="#DCFCE7" border="#22C55E" label="Location" />
              <LegendChip color="#FEF3C7" border="#F59E0B" label="Summary / Evidence" />
            </>
          ) : (
            <>
              <LegendChip color="#FEE2E2" border="#EF4444" label="Suspect" />
              <LegendChip color="#FEF9C3" border="#EAB308" label="Witness" />
              <LegendChip color="#F3E8FF" border="#A855F7" label="Associate" />
              <LegendChip color="#F1F5F9" border="#64748B" label="Prior FIR" />
            </>
          )}
        </div>
      </div>

      {/* ReactFlow Canvas + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph Canvas */}
        <div
          className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          style={{ height: "480px" }}
        >
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            onNodeClick={(_e, node) => setSelectedMeta(node.data.meta ?? null)}
          >
            <Background color="#94A3B8" gap={24} size={1} />
            <Controls />
            <MiniMap
              nodeColor={n => {
                const type = n.data?.meta?.type ?? "";
                return type === "accused" ? "#EF4444"
                  : type === "victim"      ? "#3B82F6"
                  : type === "location"    ? "#22C55E"
                  : type === "evidence"    ? "#F59E0B"
                  : type === "witness"     ? "#EAB308"
                  : type === "associate"   ? "#A855F7"
                  : type === "case"        ? "#1E3A8A"
                  : "#64748B";
              }}
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px" }}
            />
          </ReactFlow>
        </div>

        {/* Suspect / Node Details Panel */}
        <div
          className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider">Node Details Panel</h3>
            <span className="bg-blue-800 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              {currentCase?.firNumber || currentCase?.id}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <DetailPanel
              meta={selectedMeta}
              onGeneratePDF={() => generateCasePDF(currentCase)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkGraph;
