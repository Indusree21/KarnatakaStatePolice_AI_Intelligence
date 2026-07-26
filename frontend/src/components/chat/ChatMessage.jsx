import { FaUserShield, FaRobot } from "react-icons/fa";

function ChatMessage({ sender, text }) {
  const isOfficer = sender === "officer";

  return (
    <div
      className={`flex ${isOfficer ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex items-end gap-2 max-w-[75%] ${
          isOfficer ? "flex-row-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
            isOfficer ? "bg-blue-700" : "bg-green-600"
          }`}
        >
          {isOfficer ? <FaUserShield /> : <FaRobot />}
        </div>

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow ${
            isOfficer
              ? "bg-blue-700 text-white rounded-br-sm"
              : "bg-gray-200 text-gray-800 rounded-bl-sm"
          }`}
        >
          <p className="text-sm font-semibold mb-1">
            {isOfficer ? "Officer" : "AI Assistant"}
          </p>

          <p>{text}</p>

          <p
            className={`text-xs mt-2 ${
              isOfficer ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;