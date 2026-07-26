function CrimeDetailsPanel({ crime, onViewCase }) {
  if (!crime) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mt-5">

      <h2 className="text-xl font-bold text-blue-800 mb-4">
        Crime Details
      </h2>

      <div className="space-y-3">

        <div>
          <p className="text-gray-500 text-sm">FIR Number</p>
          <p className="font-semibold">{crime.fir}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Crime Type</p>
          <p>{crime.crime}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Location</p>
          <p>{crime.location}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Description</p>
          <p>{crime.description}</p>
        </div>

      </div>

      <button
        onClick={onViewCase}
        className="mt-5 w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg"
      >
        View Full Case
      </button>

    </div>
  );
}

export default CrimeDetailsPanel;