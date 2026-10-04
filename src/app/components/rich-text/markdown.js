import { Marked } from "marked";
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "span", "strong", "b", "em", "i", "u", "s", "del",
  "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4",
  "code", "pre", "a", "table", "thead", "tbody", "tr", "th", "td", "hr", "input", "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "type", "checked", "disabled", "src", "alt", "class", "align", "start"];

const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:)/i;

const COPY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

const parser = new Marked({ gfm: true, breaks: false });
const cache = new Map();
let purifier = null;

function getPurifier() {
  if (purifier || typeof window === "undefined") return purifier;

  const instance = DOMPurify(window);
  if (!instance.isSupported) return null;

  instance.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
    if (node.tagName === "INPUT") {
      node.setAttribute("type", "checkbox");
      node.setAttribute("disabled", "");
      node.setAttribute("class", "checkbox");
    }
    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      node.setAttribute("referrerpolicy", "no-referrer");
    }
  });

  purifier = instance;
  return purifier;
}

function decorate(html) {
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("table").forEach((table) => {
    const wrap = document.createElement("div");
    wrap.className = "md-table scrollbar";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });

  root.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    const language = /language-([\w-]+)/.exec(code?.className || "")?.[1];

    const box = document.createElement("div");
    box.className = "md-code";

    const head = document.createElement("div");
    head.className = "flex items-center justify-between gap-2 border-b border-white/5 py-1 pl-3 pr-1.5 font-mono text-2xs text-neutral-500";

    const label = document.createElement("span");
    label.textContent = language || "kod";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-copy-code", "");
    button.className = "inline-flex h-6 items-center gap-1.5 rounded-md px-2 font-sans text-2xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100";
    button.innerHTML = `${COPY_ICON}<span>Kopyala</span>`;

    head.append(label, button);
    pre.className = "scrollbar";
    pre.replaceWith(box);
    box.append(head, pre);
  });

  return root.innerHTML;
}

export function renderTaskMarkdown(source) {
  const text = typeof source === "string" ? source : "";
  if (!text.trim()) return "";
  if (cache.has(text)) return cache.get(text);

  const instance = getPurifier();
  if (!instance) return "";

  const html = decorate(instance.sanitize(parser.parse(text), { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP }));

  if (cache.size > 50) cache.clear();
  cache.set(text, html);
  return html;
}

export function taskReadMinutes(source) {
  const words = (typeof source === "string" ? source : "").match(/\S+/g)?.length ?? 0;
  return Math.max(1, Math.round(words / 180));
}

export function taskFirstLine(source) {
  const line = (typeof source === "string" ? source : "")
    .split("\n")
    .map((row) => row.replace(/^#{1,6}\s+|^[-*>]\s+|[*_`]/g, "").trim())
    .find(Boolean);

  return (line || "Boş görev").slice(0, 90);
}
