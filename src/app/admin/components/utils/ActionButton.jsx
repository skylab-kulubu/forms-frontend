import Link from "next/link";

export default function ActionButton({ href, onClick, icon: Icon, label, variant = "ghost", size = "sm", tone = "default", className = "", title, "aria-label": ariaLabel, disabled, ...props}) {
  const sizeClass = size === "md" ? "h-9 w-9 rounded-lg" : "h-8 w-8 rounded-md";
  const ringClass = tone === "header" ? "focus-visible:ring-neutral-700" : "focus-visible:ring-white/30";
  let variantClass = "";
  if (variant === "primary") {
    variantClass = "border-indigo-400/40 bg-indigo-500/10 text-indigo-100 hover:border-indigo-300/60 hover:bg-indigo-400/20";
  } else if (tone === "header") {
    variantClass = "border-neutral-900/80 text-neutral-200 hover:border-neutral-800 hover:bg-neutral-900/60";
  } else {
    variantClass = "border-white/10 bg-transparent text-neutral-200 hover:border-white/20 hover:bg-white/5";
  }
  const base = "inline-flex items-center justify-center border text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2";
  const buttonClass = `${base} ${sizeClass} ${ringClass} ${variantClass} ${className}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={buttonClass}
        aria-label={ariaLabel ?? label ?? title} title={title ?? label} {...props}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </Link>
    );
  }

  const isDisabled = Boolean(disabled ?? !onClick);
  const disabledClass = isDisabled ? "cursor-not-allowed opacity-60 hover:bg-white/5" : "";

  return (
    <button onClick={onClick} disabled={isDisabled} className={`${buttonClass} ${disabledClass}`}
      aria-label={ariaLabel ?? label ?? title} title={title ?? label} {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </button>
  );
}