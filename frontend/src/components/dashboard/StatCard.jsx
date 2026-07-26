const COLOR_MAP = {
  blue:  { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
  amber: { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
  red:   { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100" },
  green: { bg: "bg-emerald-50",text: "text-emerald-600",border: "border-emerald-100" },
};

function StatCard({ title, value, icon, color = "blue" }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${c.border} p-5 flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      {icon && (
        <div className={`${c.bg} ${c.text} w-11 h-11 rounded-xl flex items-center justify-center text-xl`}>
          {icon}
        </div>
      )}
    </div>
  );
}

export default StatCard;
