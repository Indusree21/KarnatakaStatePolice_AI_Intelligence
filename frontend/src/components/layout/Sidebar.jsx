function Sidebar() {
  return (
    <div className="w-64 bg-blue-900 text-white p-5">
      <h1 className="text-2xl font-bold mb-8">
        🚔 KSP AI
      </h1>

      <ul className="space-y-4">
        <li>➕ New</li>
        <li>💬 AI Chat</li>
        <li>📂 Case History</li>
        <li>📊 Analytics</li>
        <li>📄 Reports</li>
        <li>⚙ Settings</li>
      </ul>
    </div>
  );
}

export default Sidebar;