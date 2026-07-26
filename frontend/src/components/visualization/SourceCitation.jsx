/**
 * SourceCitation
 * Renders citation strings returned by the backend in the citations[] array.
 */
function SourceCitation({ citations = [] }) {
  if (!citations.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        📄 Source Citations
        <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono">
          {citations.length}
        </span>
      </h3>
      <ul className="space-y-2">
        {citations.map((cite, i) => (
          <li
            key={i}
            className="border-l-4 border-blue-600 bg-blue-50 px-3 py-2 rounded-r-lg text-xs text-blue-900 font-medium"
          >
            {cite}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SourceCitation;
