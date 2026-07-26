import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Map rank to backend RBAC role
const RANK_TO_ROLE = {
  Constable: "CONSTABLE",
  "Head Constable": "CONSTABLE",
  "Sub Inspector": "INSPECTOR",
  Inspector: "INSPECTOR",
  DSP: "INSPECTOR",
  SP: "INSPECTOR",
  Commissioner: "INSPECTOR",
};

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    employeeId: "",
    password: "",
    rank: "",
    name: "",
    station: "",
    district: "",
    language: "en",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!formData.employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }
    if (!formData.rank) {
      setError("Please select your rank.");
      return;
    }

    const role = RANK_TO_ROLE[formData.rank] || "CONSTABLE";

    login({
      userId: formData.employeeId.trim(),
      name: formData.name.trim() || formData.employeeId.trim(),
      role,
      rank: formData.rank,
      station: formData.station.trim() || "HQ",
      district: formData.district.trim() || "Karnataka",
      language: formData.language,
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-5">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden grid md:grid-cols-2">

        {/* Left Panel */}
        <div className="bg-blue-900 text-white p-10 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🚔</span>
            <div>
              <h1 className="text-3xl font-bold leading-tight">Karnataka State Police</h1>
              <p className="text-blue-200 text-sm mt-1">Intelligence Portal — Datathon 2026</p>
            </div>
          </div>
          <p className="text-blue-100 leading-7 text-sm">
            AI-powered assistant for searching FIRs, analysing crime patterns,
            generating investigation reports, and discovering criminal networks
            using natural language — in English or Kannada.
          </p>
          <div className="space-y-2 text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <span className="bg-blue-700 px-2 py-0.5 rounded font-mono">SQL</span>
              <span>Natural-language crime database queries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-700 px-2 py-0.5 rounded font-mono">RAG</span>
              <span>Document & FIR brief search</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-700 px-2 py-0.5 rounded font-mono">GRAPH</span>
              <span>Criminal network link analysis</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Officer Login</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              name="employeeId"
              placeholder="Employee ID *"
              required
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              onChange={handleChange}
              value={formData.employeeId}
            />

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              onChange={handleChange}
              value={formData.name}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              onChange={handleChange}
            />

            <select
              name="rank"
              required
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              onChange={handleChange}
              value={formData.rank}
            >
              <option value="">Select Rank *</option>
              <option>Constable</option>
              <option>Head Constable</option>
              <option>Sub Inspector</option>
              <option>Inspector</option>
              <option>DSP</option>
              <option>SP</option>
              <option>Commissioner</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="station"
                placeholder="Police Station"
                className="border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                onChange={handleChange}
                value={formData.station}
              />
              <input
                type="text"
                name="district"
                placeholder="District"
                className="border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                onChange={handleChange}
                value={formData.district}
              />
            </div>

            <select
              name="language"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              onChange={handleChange}
              value={formData.language}
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-900 text-white p-3 rounded-lg font-semibold hover:bg-blue-800 transition text-sm"
            >
              Login to Portal
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Karnataka State Police — Secure Intelligence System
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
