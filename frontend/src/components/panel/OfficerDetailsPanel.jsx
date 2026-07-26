function OfficerDetailsPanel({ officer }) {
  if (!officer) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-5">
        <h2 className="text-xl font-bold mb-4">
          Details
        </h2>

        <p className="text-gray-500">
          Click on a suspect or case node to view details.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <h2 className="text-xl font-bold mb-5">
        Suspect Details
      </h2>

      <div className="space-y-3">

        <p><strong>Name:</strong> {officer.name}</p>

        <p><strong>Age:</strong> {officer.age}</p>

        <p><strong>Role:</strong> {officer.role}</p>

        <p><strong>Previous Cases:</strong> {officer.previousCases}</p>

        <p><strong>Status:</strong> {officer.status}</p>

      </div>
    </div>
  );
}

export default OfficerDetailsPanel;