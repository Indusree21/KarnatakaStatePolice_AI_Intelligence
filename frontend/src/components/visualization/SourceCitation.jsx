function SourceCitation() {
  const sources = [
    "FIR No. 102/2025 - Mysuru City Police",
    "FIR No. 205/2025 - Nazarbad Police Station",
    "Case Report 18 - Vehicle Theft Investigation",
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5 mt-6">
      <h2 className="text-xl font-bold mb-4">
        📄 Source Citations
      </h2>

      <ul className="space-y-3">
        {sources.map((source, index) => (
          <li
            key={index}
            className="border-l-4 border-blue-700 bg-gray-50 p-3 rounded"
          >
            {source}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SourceCitation;