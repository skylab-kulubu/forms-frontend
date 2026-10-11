"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import TaskMarkdown from "@/app/components/rich-text/TaskMarkdown";
import { taskReadMinutes } from "@/app/components/rich-text/markdown";

const LINK_BUTTON = "underline underline-offset-3 transition-colors";
const COLLAPSED_HEIGHT = 384;

function fileNameOf(title) {
  const slug = (title || "gorev")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ışğüöçâî]/g, (char) => ({ ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i" }[char]))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "gorev"}.md`;
}

export default function TaskBlock({ task, title, meta = null, className = "" }) {
  const bodyRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const content = task?.content ?? "";
  const collapsible = task?.collapsible !== false && overflows;
  const collapsed = collapsible && !expanded;

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const measure = () => setOverflows(body.scrollHeight > COLLAPSED_HEIGHT + 48);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(body);
    return () => observer?.disconnect();
  }, [content]);

  if (!content.trim()) return null;

  const download = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileNameOf(title);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`px-2 md:px-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/5 pb-3 text-2xs text-neutral-500">
        {meta}
        <span className="inline-flex items-center gap-1.5">
          <FileText size={12} />
          {taskReadMinutes(content)} dk okuma
        </span>
        {task?.downloadable !== false && (
          <button type="button" onClick={download}
            className={`ml-auto inline-flex items-center gap-1.5 ${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
          >
            <Download size={12} />
            İndir
          </button>
        )}
      </div>

      <div ref={bodyRef}
        className={`pt-4 ${collapsed ? "max-h-96 overflow-hidden mask-[linear-gradient(to_bottom,black_62%,transparent)]" : ""}`}
      >
        <TaskMarkdown content={content} className="max-sm:text-[0.8125rem]" />
      </div>

      {collapsible && (
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={!collapsed}
          className={`mt-2 inline-flex items-center gap-1.5 text-xs ${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
        >
          {collapsed ? "Devamını göster" : "Daralt"}
          <ChevronDown size={14} className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
        </button>
      )}
    </div>
  );
}
