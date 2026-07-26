import React from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "New FIR", path: "/new-fir", icon: "📝" },
    { label: "Settings", path: "/settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 h-screen shrink-0 border-r border-slate-800">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-6">
          <span className="text-2xl">🚔</span>
          <div>
            <h1 className="font-bold text-sm tracking-wide">KSP INTELLIGENCE</h1>
            <p className="text-[10px] text-slate-400">State Police Portal</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4 px-3 text-xs text-slate-400">
        Logged in as Officer
      </div>
    </aside>
  );
}

export default Sidebar;