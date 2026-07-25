import { useState } from "react";

function ChatInput({ onSend }) {
  const [query, setQuery] = useState("");

  const handleSend = () => {
    if (!query.trim()) return;

    onSend(query);
    setQuery("");
  };

  return (
    <div className="border-t pt-4 flex gap-3">
      <button className="bg-gray-200 px-3 py-2 rounded">📎</button>

      <button className="bg-gray-200 px-3 py-2 rounded">🎤</button>

      <input
        className="flex-1 border rounded px-4"
        placeholder="Ask anything..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={handleSend}
        className="bg-blue-900 text-white px-5 rounded"
      >
        Send
      </button>
    </div>
  );
}

export default ChatInput;