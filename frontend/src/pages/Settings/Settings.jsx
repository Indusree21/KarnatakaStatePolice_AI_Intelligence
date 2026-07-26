import React, { useState } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    officerName: "Inspector Rajesh Kumar",
    badgeNumber: "KSP-8842",
    station: "Mysuru Central Station",
    email: "rajesh.ksp@karnataka.gov.in",
    phone: "+91 98765 43210",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    highPrioritySms: true,
    dailyReportSummary: false,
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />

        <main className="p-6 max-w-4xl w-full mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <span>⚙️</span> System Settings
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Manage officer profile details, security parameters, and portal notifications.
                </p>
              </div>
              {saved && (
                <span className="bg-emerald-50 text-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
                  ✓ Changes Saved
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-medium">
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-3 transition-all ${
                  activeTab === "profile"
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Officer Profile
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`pb-3 transition-all ${
                  activeTab === "security"
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Security & Password
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`pb-3 transition-all ${
                  activeTab === "notifications"
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Notifications & Alerts
              </button>
            </div>

            {/* Tab 1: Profile Settings */}
            {activeTab === "profile" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Officer Name
                    </label>
                    <input
                      type="text"
                      name="officerName"
                      value={profile.officerName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Badge / ID Number
                    </label>
                    <input
                      type="text"
                      name="badgeNumber"
                      value={profile.badgeNumber}
                      disabled
                      className="w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Station
                    </label>
                    <input
                      type="text"
                      name="station"
                      value={profile.station}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Security & Password */}
            {activeTab === "security" && (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Email Incident Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Receive an automated email whenever a new FIR is logged under your jurisdiction.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailAlerts}
                    onChange={() => handleToggle("emailAlerts")}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      High Priority SMS Alerts
                    </p>
                    <p className="text-xs text-slate-500">
                      Get urgent SMS notifications on your registered mobile number for critical cases.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.highPrioritySms}
                    onChange={() => handleToggle("highPrioritySms")}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Daily Case Summary Digest
                    </p>
                    <p className="text-xs text-slate-500">
                      Receive a daily summary of resolved vs. pending cases every evening.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.dailyReportSummary}
                    onChange={() => handleToggle("dailyReportSummary")}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;