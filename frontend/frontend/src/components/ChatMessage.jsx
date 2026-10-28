import TrainResults from "./TrainResults";

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-[message-in_0.35s_ease-out] ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[88%] ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
            isUser
              ? "rounded-br-md bg-teal-600 text-white shadow-md shadow-teal-600/10"
              : "rounded-bl-md border border-white/10 bg-[#1e1e1e] text-slate-300 shadow-sm shadow-black/20"
          }`}
        >
          {message.content}
          <TrainResults results={message.results} />
        </div>
        {message.time && (
          <span className="mt-1 px-1 text-[11px] text-slate-500">
            {message.time}
          </span>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
