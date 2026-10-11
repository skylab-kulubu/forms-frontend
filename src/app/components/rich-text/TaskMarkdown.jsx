"use client";

import { useMemo } from "react";
import { renderTaskMarkdown } from "./markdown";

export default function TaskMarkdown({ content, small = false, className = "" }) {
  const html = useMemo(() => renderTaskMarkdown(content), [content]);

  const handleClick = (event) => {
    const button = event.target.closest?.("[data-copy-code]");
    if (!button) return;

    const code = button.closest(".md-code")?.querySelector("pre");
    if (!code) return;

    navigator.clipboard?.writeText(code.textContent ?? "").then(() => {
      const label = button.querySelector("span");
      if (!label) return;
      label.textContent = "Kopyalandı";
      setTimeout(() => { label.textContent = "Kopyala"; }, 1400);
    }).catch(() => {});
  };

  return (
    <div className={`task-prose ${small ? "is-small" : ""} ${className}`} onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
