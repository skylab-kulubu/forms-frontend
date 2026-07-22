export default function Tip({ label, children }) {
    return (
        <div className="group/tip relative flex">
            {children}
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-3xs font-medium text-neutral-200 opacity-0 shadow-lg transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100">
                {label}
            </span>
        </div>
    );
}
