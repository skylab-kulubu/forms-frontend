"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs as Trail } from "@skylab-kulubu/skylcn-ui";

function formatLabel(part) {
  return part
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPatternLabel(href, labels) {
  const entries = Object.entries(labels || {}).filter(([key]) => key.includes(":"));
  if (entries.length === 0) return null;

  const hrefParts = href.split("/").filter(Boolean);
  let bestLabel = null;
  let bestScore = -1;

  for (const [pattern, label] of entries) {
    const patternParts = pattern.split("/").filter(Boolean);
    if (patternParts.length !== hrefParts.length) continue;

    let score = 0;
    let match = true;

    for (let i = 0; i < patternParts.length; i += 1) {
      const part = patternParts[i];
      if (part.startsWith(":")) continue;
      if (part !== hrefParts[i]) {
        match = false;
        break;
      }
      score += 1;
    }

    if (match && score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }

  return bestLabel;
}

function trailOf(pathname, labels, includeRoot, rootLabel) {
  const parts = pathname.split("/").filter(Boolean);
  const adminIdx = parts.indexOf("admin");
  const labelOf = (href, seg) => labels[href] || getPatternLabel(href, labels) || labels[seg] || formatLabel(seg);

  if (adminIdx < 0) {
    const acc = [];
    return parts.map((seg) => {
      acc.push(seg);
      const href = "/" + acc.join("/");
      return { href, label: labelOf(href, seg) };
    });
  }

  const baseParts = parts.slice(0, adminIdx + 1);
  const rest = parts.slice(adminIdx + 1);
  const computed = rest.map((seg, i) => {
    const href = "/" + baseParts.concat(rest.slice(0, i + 1)).join("/");
    return { href, label: labelOf(href, seg) };
  });

  if (!includeRoot) return computed;
  const baseHref = "/" + baseParts.join("/");
  return [{ href: baseHref, label: labels[baseHref] || rootLabel }, ...computed];
}

/** forms' trail from the address and its label map, drawn by skylcn's Breadcrumbs. */
export default function Breadcrumbs({ segments, labels = {}, includeRoot = true, rootLabel = "Dashboard", className }) {
  const pathname = usePathname() || "/";
  const items = segments ?? trailOf(pathname, labels, includeRoot, rootLabel);
  return <Trail items={items} className={className} />;
}
