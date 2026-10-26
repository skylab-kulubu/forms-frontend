"use client";

import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

export function KV({ label, hint = null, children }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-neutral-400">{label}</p>
        {hint ? <p className="text-3xs text-neutral-600">{hint}</p> : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs text-neutral-200">{children}</div>
    </div>
  );
}

export function Crumbs({ items }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight size={13} className="shrink-0 text-neutral-600" /> : null}
            {last || !item.onClick ? (
              <span className={`min-w-0 truncate ${last ? "text-neutral-200" : "text-neutral-500"}`}>{item.label}</span>
            ) : (
              <button type="button" onClick={item.onClick} title={item.label}
                className="min-w-10 max-w-32 shrink truncate rounded px-0.5 text-neutral-500 transition-colors hover:text-neutral-300"
              >
                {item.label}
              </button>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
