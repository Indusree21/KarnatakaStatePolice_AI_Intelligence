import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";

// --- Mock Data ---
const monthlyTrendData = [
  { month: "Jan", crimes: 35 },
  { month: "Feb", crimes: 42 },
  { month: "Mar", crimes: 28 },
  { month: "Apr", crimes: 50 },
  { month: "May", crimes: 40 },
  { month: "Jun", crimes: 55 },
];

const categoryData = [
  { category: "Vehicle Theft", count: 420 },
  { category: "Cybercrime", count: 310 },
  { category: "Burglary", count: 280 },
  { category: "Assault", count: 190 },
];

const districtData = [
  { district: "Bengaluru", cases: 120 },
  { district: "Mysuru", cases: 86 },
  { district: "Hubballi", cases: 65 },
  { district: "Mangaluru", cases: 45 },
  { district: "Belagavi", cases: 38 },
];

function CrimeChart() {
  return (
    <div className="space-y-6 mt-6">
      {/* 1. TOP STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cases</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">1,248</h3>
            <span className="text-xs text-emerald-600 font-medium">↑ 8.2% from last month</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solved Cases</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">892</h3>
            <span className="text-xs text-emerald-600 font-medium">71.4% Clearance Rate</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Cases</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">356</h3>
            <span className="text-xs text-amber-600 font-medium">Requires follow-up</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">High Risk Cases</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">42</h3>
            <span className="text-xs text-rose-600 font-medium">Priority Attention</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Your Original Line Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            📊 Crime Trend Analysis
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="crimes"
                stroke="#1E3A8A"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crimes by Category */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            📑 Crimes by Category
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart layout="vertical" data={categoryData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* District Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            🏛️ District-wise Incidents
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="district" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Investigation Progress */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            ⚖️ Investigation Status
          </h2>
          <div className="space-y-4 my-auto">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-gray-600">Charge Sheet Filed</span>
                <span className="text-gray-900 font-semibold">58%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "58%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-gray-600">Under Active Investigation</span>
                <span className="text-gray-900 font-semibold">28%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "28%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-gray-600">Pending Forensics / Reports</span>
                <span className="text-gray-900 font-semibold">14%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: "14%" }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CrimeChart;