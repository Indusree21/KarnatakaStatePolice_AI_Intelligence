import { useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

function ChatContainer() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Officer! How can I assist you today?",
    },
  ]);

  const handleSend = (query) => {
    if (!query.trim()) return;

    // Officer message
    const officerMessage = {
      sender: "officer",
      text: query,
    };

    // Dummy AI response
    const aiMessage = {
      sender: "ai",
      text: "Searching police records... Found matching results.",
    };

    setMessages((prev) => [...prev, officerMessage, aiMessage]);
  };

  return (
    <div className="bg-white rounded-xl shadow mt-6 p-5">
      <h2 className="text-2xl font-bold mb-5">
        AI Investigation Assistant
      </h2>

      <div className="space-y-4 h-96 overflow-y-auto mb-5">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            sender={msg.sender}
            text={msg.text}
          />
        ))}
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default ChatContainer;