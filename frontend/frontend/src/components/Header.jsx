import Icon from "./Icon";

function Header({ resetChat }) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
          <Icon className="h-5 w-5">
            <path d="M7 3h10a2 2 0 0 1 2 2v10a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V5a2 2 0 0 1 2-2Z" />
            <path d="M7 8h10M8 21l-2 2m10-2 2 2M8 13h.01M16 13h.01" />
          </Icon>
        </div>
        <h1 className="text-base font-bold tracking-tight">Railway assistant</h1>
      </div>
      <button
        className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
        onClick={resetChat}
        type="button"
      >
        New search
      </button>
    </header>
  );
}

export default Header;
