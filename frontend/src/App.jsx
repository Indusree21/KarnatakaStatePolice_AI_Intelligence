import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import NewFIR from "./pages/NewFIR/NewFIR.jsx";
import Settings from "./pages/Settings/Settings.jsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-fir" element={<NewFIR />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;