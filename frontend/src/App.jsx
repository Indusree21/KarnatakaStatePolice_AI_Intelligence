import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import NewFIR from "./pages/NewFIR/NewFIR";
import CaseHistory from "./pages/CaseHistory/CaseHistory";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-fir" element={<NewFIR />} />
        <Route path="/cases" element={<CaseHistory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;