import { useState } from "react";
import {
  FaPaperclip,
  FaMicrophone,
  FaPaperPlane,
} from "react-icons/fa";

function ChatInput({ onSend }) {
  const [query, setQuery] = useState("");

  const handleSend = () => {
    if (!query.trim()) return;

    onSend(query);
    setQuery("");
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center gap-3">

        {/* Upload Button */}
        <button className="w-11 h-11 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
          <FaPaperclip />
        </button>

        {/* Voice Button */}
        <button className="w-11 h-11 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
          <FaMicrophone />
        </button>

        {/* Input */}
        <input
          type="text"
          placeholder="Ask about FIRs, suspects, crime trends..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="flex-1 border rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-700"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center"
        >
          <FaPaperPlane />
        </button>

      </div>
    </div>
  );
}

export default ChatInput;