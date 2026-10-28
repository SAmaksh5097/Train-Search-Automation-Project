import Icon from "./Icon";

function ChatInput({ input, isLoading, inputRef, onChange, onSubmit }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit(event);
    }
  }

  return (
    <form
      className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#1e1e1e] p-2 shadow-lg shadow-black/30 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10"
      onSubmit={onSubmit}
    >
      <textarea
        aria-label="Message"
        autoFocus
        className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        disabled={isLoading}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Tell me your departure station..."
        ref={inputRef}
        rows="1"
        value={input}
      />
      <button
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        disabled={!input.trim() || isLoading}
        type="submit"
      >
        <Icon className="h-5 w-5">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </Icon>
      </button>
    </form>
  );
}

export default ChatInput;
