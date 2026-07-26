import { useAuth } from "../../context/AuthContext";

function WelcomeBanner() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-6 flex flex-wrap justify-between items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {user?.name || "Officer"} 👋
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          {user?.rank} · {user?.station} · {user?.district}
        </p>
        <p className="text-blue-200 text-xs mt-2">
          AI Assistant is ready. Query the database in English or Kannada.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
        <span className="text-2xl">🤖</span>
        <div className="text-right">
          <p className="text-xs font-bold">KSP AI Engine</p>
          <p className="text-[10px] text-blue-200">SQL · RAG · Graph</p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;
