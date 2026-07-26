import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard",      path: "/dashboard",     icon: "📊" },
  { label: "Register FIR",   path: "/new-fir",       icon: "📝" },
  { label: "Case History",   path: "/case-history",  icon: "📁" },
  { label: "Reports",        path: "/reports",       icon: "📈" },
  { label: "Settings",       path: "/settings",      icon: "⚙️" },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col justify-between p-4 h-screen shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-800 mb-5">
          <span className="text-2xl">🚔</span>
          <div>
            <h1 className="font-bold text-sm tracking-wide">KSP INTELLIGENCE</h1>
            <p className="text-[10px] text-slate-400">State Police Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
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

      {/* Officer info + logout */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        {user && (
          <div className="px-2 space-y-0.5">
            <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400">{user.rank} — {user.station}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              user.role === "INSPECTOR"
                ? "bg-blue-800 text-blue-200"
                : "bg-slate-700 text-slate-300"
            }`}>
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
