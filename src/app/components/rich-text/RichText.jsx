"use client";

import { Fragment, useMemo } from "react";
import { parseInline } from "./parseInline";

export const RICH_TEXT_LINK_CLASS =
  "text-skylab-300 underline decoration-skylab-300/30 underline-offset-2 wrap-break-word transition-colors hover:decoration-skylab-300/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-skylab-400/40 focus-visible:rounded-sm";

export function RichText({ text, as: Tag = "span", className, linkClassName = RICH_TEXT_LINK_CLASS, fallback = null }) {
  const nodes = useMemo(() => parseInline(text), [text]);

  if (nodes.length === 0) return fallback;

  return (
    <Tag className={className}>
      {nodes.map((node, index) =>
        node.type === "link" ? (
          <a key={index} href={node.href} target="_blank" rel="noopener noreferrer nofollow"
            onClick={(event) => event.stopPropagation()}
            className={linkClassName}
          >
            {node.text}
          </a>
        ) : (
          <Fragment key={index}>{node.text}</Fragment>
        )
      )}
    </Tag>
  );
}
