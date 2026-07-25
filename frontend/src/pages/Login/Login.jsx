import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employeeId: "",
    password: "",
    rank: "",
    station: "",
    district: "",
    language: "English",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();

    // Temporary login
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-5">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden grid md:grid-cols-2">

        {/* Left Side */}
        <div className="bg-blue-900 text-white p-10 flex flex-col justify-center">

          <h1 className="text-4xl font-bold mb-3">
            🚔 Karnataka State Police
          </h1>

          <h2 className="text-xl mb-6">
            AI Conversational Investigation System
          </h2>

          <p className="text-blue-100 leading-7">
            Secure AI-powered assistant for police officers to search FIRs,
            analyze crime patterns, generate investigation reports, and discover
            criminal links using natural language.
          </p>

        </div>

        {/* Right Side */}

        <div className="p-10">

          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            Officer Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">

            <input
              type="text"
              name="employeeId"
              placeholder="Employee ID"
              className="w-full border rounded-lg p-3"
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full border rounded-lg p-3"
              onChange={handleChange}
            />

            <select
              name="rank"
              className="w-full border rounded-lg p-3"
              onChange={handleChange}
            >
              <option value="">Select Rank</option>
              <option>Constable</option>
              <option>Head Constable</option>
              <option>Sub Inspector</option>
              <option>Inspector</option>
              <option>DSP</option>
              <option>SP</option>
              <option>Commissioner</option>
            </select>

            <input
              type="text"
              name="station"
              placeholder="Police Station"
              className="w-full border rounded-lg p-3"
              onChange={handleChange}
            />

            <input
              type="text"
              name="district"
              placeholder="District"
              className="w-full border rounded-lg p-3"
              onChange={handleChange}
            />

            <select
              name="language"
              className="w-full border rounded-lg p-3"
              onChange={handleChange}
            >
              <option>English</option>
              <option>Kannada</option>
            </select>

            <button
              className="w-full bg-blue-900 text-white p-3 rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              Login
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}

export default Login;