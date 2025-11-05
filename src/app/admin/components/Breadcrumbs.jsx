"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatLabel(part) {
  return part
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs({ segments, labels = {}, includeRoot = true, rootLabel = "Dashboard", className }) {
  const pathname = usePathname() || "/";

  let items = segments;

  if (!items) {
    const parts = pathname.split("/").filter(Boolean);
    const adminIdx = parts.indexOf("admin");

    let computed = [];

    if (adminIdx >= 0) {
      const baseParts = parts.slice(0, adminIdx + 1);
      const rest = parts.slice(adminIdx + 1);

      computed = rest.map((seg, i) => {
        const href = "/" + baseParts.concat(rest.slice(0, i + 1)).join("/");
        const label = labels[href] || labels[seg] || formatLabel(seg);
        return { href, label };
      });

      if (includeRoot) {
        const baseHref = "/" + baseParts.join("/");
        const baseLabel = labels[baseHref] || rootLabel;
        computed = [{ href: baseHref, label: baseLabel }, ...computed];
      }
    } else {
      const acc = [];
      computed = parts.map((seg) => {
        acc.push(seg);
        const href = "/" + acc.join("/");
        const label = labels[href] || labels[seg] || formatLabel(seg);
        return { href, label };
      });
    }

    items = computed;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-neutral-500", className)}>
      <ol role="list" className="flex items-center">
        {items?.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.href} className="inline-flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <ChevronRight className="h-4 w-4 mt-0.5 text-neutral-300" />
              )}

              {isLast ? (
                <span aria-current="page" className="max-w-[180px] truncate font-medium text-neutral-200" title={item.label}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="rounded-md px-1.5 py-1 transition-colors hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2">
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
