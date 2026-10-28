function LoadingIndicator() {
  return (
    <div className="flex animate-[message-in_0.35s_ease-out] items-center gap-3">
      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-[#1e1e1e] px-4 py-3 shadow-sm shadow-black/20">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
        </div>
      </div>
      <span className="text-xs text-slate-500">Assistant is thinking</span>
    </div>
  );
}

export default LoadingIndicator;
