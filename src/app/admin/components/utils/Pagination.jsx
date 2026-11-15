"use client";

import { Pagination as SkylcnPagination } from "@skylab-kulubu/skylcn-ui";

// The sticky bar belongs to forms' table layout; skylcn's Pagination is only the steps
export default function Pagination({ current = 1, totalPages = 1, onPageChange, className = "" }) {
  if (!(Number(totalPages) > 1)) return null;

  return (
    <div className="sticky bottom-0 z-20 bg-neutral-900">
      <SkylcnPagination current={current} totalPages={totalPages} onPageChange={onPageChange} className={`pt-3 ${className}`} />
    </div>
  );
}
