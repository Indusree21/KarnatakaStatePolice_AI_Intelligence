function ChatMessage({ sender, text }) {
  const isOfficer = sender === "officer";

  return (
    <div
      className={`flex ${
        isOfficer ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[70%] p-4 rounded-xl ${
          isOfficer
            ? "bg-blue-900 text-white"
            : "bg-gray-200 text-black"
        }`}
      >
        <p className="font-semibold mb-1">
          {isOfficer ? "👮 Officer" : "🤖 AI Assistant"}
        </p>

        <p>{text}</p>
      </div>
    </div>
  );
}

export default ChatMessage;