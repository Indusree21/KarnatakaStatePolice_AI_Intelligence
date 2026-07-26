import React, { useState } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";

const INITIAL_FORM_STATE = {
  complainantName: "",
  contactNumber: "",
  incidentType: "Vehicle Theft",
  location: "Mysuru Central Station",
  incidentDate: "",
  incidentTime: "",
  description: "",
  priority: "Medium",
};

function NewFIR() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [generatedFirNo, setGeneratedFirNo] = useState("");

  // Get current date for disabling future incident dates
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Generate a clean FIR Number (e.g. FIR-202)
    const randomId = Math.floor(100 + Math.random() * 900);
    const newFirNumber = `FIR-${randomId}`;

    setGeneratedFirNo(newFirNumber);

    // Create the full FIR record
    const newFirRecord = {
      firNumber: newFirNumber,
      complainantName: formData.complainantName.trim(),
      contactNumber: formData.contactNumber.trim(),
      incidentType: formData.incidentType,
      location: formData.location,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      description: formData.description.trim(),
      priority: formData.priority,
      status: "Pending Investigation",
      registeredAt: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    // Safely save to localStorage
    try {
      const existingFirs = JSON.parse(localStorage.getItem("firs") || "[]");
      const updatedFirs = [newFirRecord, ...existingFirs];
      localStorage.setItem("firs", JSON.stringify(updatedFirs));
    } catch (err) {
      console.error("Failed to save FIR to local storage:", err);
    }

    setSubmitted(true);
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setSubmitted(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />

        <main className="p-6 max-w-4xl w-full mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            {/* Page Header */}
            <div className="border-b border-slate-100 pb-4 mb-6 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Register New FIR
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  File and log new crime incident records into the Karnataka State Police database.
                </p>
              </div>
              <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200 shadow-xs">
                KSP Crime Portal
              </span>
            </div>

            {/* Success Card */}
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4 my-4">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-emerald-900">
                  FIR Successfully Registered!
                </h2>
                <p className="text-sm text-emerald-700">
                  Assigned Reference Number:{" "}
                  <strong className="text-emerald-950 font-mono text-base bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                    {generatedFirNo}
                  </strong>
                </p>
                <p className="text-xs text-emerald-600 italic">
                  This record is now synced with your AI Police Assistant and station records.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow transition-all flex items-center gap-2"
                  >
                    <span>+</span> File Another FIR
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Complainant Details Section */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    1. Complainant Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Complainant Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="complainantName"
                        required
                        value={formData.complainantName}
                        onChange={handleChange}
                        placeholder="e.g., Ramesh Kumar"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        required
                        pattern="^[0-9+\s-]{10,15}$"
                        title="Please enter a valid phone number"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Categorization & Location Section */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Classification & Jurisdiction
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Incident Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="incidentType"
                        value={formData.incidentType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      >
                        <option>Vehicle Theft</option>
                        <option>Burglary / Break-in</option>
                        <option>Cybercrime / Online Fraud</option>
                        <option>Physical Assault</option>
                        <option>Chain Snatching</option>
                        <option>Other Offense</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Police Station Jurisdiction <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      >
                        <option>Mysuru Central Station</option>
                        <option>Bengaluru City Station</option>
                        <option>Mandya Town Station</option>
                        <option>Hubballi Urban Station</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Priority Assessment
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical Threat</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Timeline & Details Section */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Time & Incident Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Incident <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="incidentDate"
                        required
                        max={today}
                        value={formData.incidentDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Approximate Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="incidentTime"
                        required
                        value={formData.incidentTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Incident Description & Details <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      rows="4"
                      required
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Provide sequence of events, suspect physical descriptions, stolen assets, or vehicle registration numbers..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all"
                    ></textarea>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-all"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Submit & Generate FIR
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default NewFIR;