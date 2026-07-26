import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { checkHealth } from "../../services/api";

function Header() {
  const { user } = useAuth();
  const [backendOk, setBackendOk] = useState(null); // null = checking, true/false

  useEffect(() => {
    checkHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-blue-900">Karnataka Police</span>
        <span className="hidden sm:block text-xs text-slate-400 font-medium">AI Intelligence System</span>
      </div>

      {/* Right: status + officer chip */}
      <div className="flex items-center gap-3">
        {/* Backend status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOk === null
                ? "bg-yellow-400 animate-pulse"
                : backendOk
                ? "bg-emerald-500"
                : "bg-red-500 animate-pulse"
            }`}
          />
          <span className={backendOk === false ? "text-red-500" : "text-slate-500"}>
            {backendOk === null
              ? "Connecting…"
              : backendOk
              ? "AI Backend Online"
              : "Backend Offline"}
          </span>
        </div>

        {/* Date */}
        <span className="hidden md:block text-xs text-slate-400">{now}</span>

        {/* Officer chip */}
        {user && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
            <span className="text-base">👤</span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.rank}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
