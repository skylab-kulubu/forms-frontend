export function FieldShell({ number, title, required, onRequiredChange, children }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-900/40 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="grid size-6 place-items-center rounded-md border border-white/15 bg-white/5 text-[13px] font-semibold text-neutral-200">
          {number}
        </div>
        <span className="text-sm font-medium text-neutral-100">{title}</span>
        <div className="ml-auto">
          <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
            <button type="button" aria-pressed={!required} onClick={() => onRequiredChange(false)}
              className={`px-2 py-1 text-[11px] rounded-lg ${!required ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}>
              Opsiyonel
            </button>
            <button type="button" aria-pressed={required} onClick={() => onRequiredChange(true)}
              className={`px-2 py-1 text-[11px] rounded-lg ${required ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}>
              Zorunlu
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-3 md:p-4">
        {children}
      </div>
    </div>
  );
}