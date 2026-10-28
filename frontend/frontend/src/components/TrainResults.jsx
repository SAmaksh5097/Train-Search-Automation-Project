function TrainResults({ results }) {
  if (!Array.isArray(results) || results.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3">
      {results.map((train, index) => (
        <article
          className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-4 shadow-sm shadow-black/20"
          key={`${train.trainName ?? "train"}-${index}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-100">
                {train.trainName ?? "Train"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {train.fromStation ?? "Departure"} to{" "}
                {train.toStation ?? "Destination"}
              </p>
            </div>
            <span className="rounded-full bg-teal-950/60 px-2.5 py-1 text-xs font-semibold text-teal-300">
              {train.classes?.join(", ") || "Classes unavailable"}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-5 text-sm">
            <div>
              <p className="text-xs text-slate-500">Departure</p>
              <p className="mt-0.5 font-semibold text-slate-200">
                {train.departure ?? "--"}
              </p>
            </div>
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-slate-500">Arrival</p>
              <p className="mt-0.5 font-semibold text-slate-200">
                {train.arrival ?? "--"}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default TrainResults;
