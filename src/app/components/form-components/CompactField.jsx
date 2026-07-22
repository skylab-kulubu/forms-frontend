export function CompactField({ question, required = false, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {question ? (
        <label className="px-0.5 text-xs font-medium text-neutral-300">
          {question}{required && <span className="ml-0.5 text-red-200/70">*</span>}
        </label>
      ) : null}
      {children}
    </div>
  );
}
