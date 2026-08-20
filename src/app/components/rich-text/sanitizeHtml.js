import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "span",
  "strong", "b", "em", "i", "u", "s", "strike", "del",
  "blockquote", "ul", "ol", "li",
  "h1", "h2", "h3",
  "code", "pre", "a",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:)/i;

let hooksReady = false;

function ensureHooks() {
  if (hooksReady) return;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });

  hooksReady = true;
}

export function sanitizeFormHtml(html) {
  if (typeof html !== "string" || html.length === 0) return "";
  if (!DOMPurify.isSupported) return "";

  ensureHooks();

  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP });
}
