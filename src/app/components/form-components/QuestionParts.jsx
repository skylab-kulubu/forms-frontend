export function QuestionNumber({ number, missing = false }) {
  if (number == null) return null;

  return (
    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors
      ${missing ? "border-red-400/50 bg-red-900/30 text-red-200" : "border-neutral-700 bg-neutral-900 text-neutral-300"}`}
    >
      {number}
    </div>
  );
}

export function QuestionHint({ required = false, missing = false, text = "Zorunlu alan", missingText = "Bu soru zorunlu", className = "mt-1" }) {
  if (missing) return <span className={`px-0.5 text-2xs text-red-200/90 ${className}`}>{missingText}</span>;
  if (!required) return null;

  return <span className={`px-0.5 text-2xs text-neutral-500 ${className}`}>{text}</span>;
}
