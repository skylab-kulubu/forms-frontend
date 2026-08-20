import { toSafeHref } from "./parseInline";

const MARKDOWN_LINK = /\[([^\]\n]+)\]\(([^\s)]+)\)/g;
const LINKABLE_PREFIX = /^(?:https?:\/\/|www\.|mailto:)/i;
const TOKEN_BOUNDARY = /[\s<>()[\]{}'"“”‘’]/;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

export const SUGGESTION_LABEL = "Bağlantı";

export function findLinkableToken(text, caret) {
  if (typeof text !== "string" || typeof caret !== "number") return null;

  MARKDOWN_LINK.lastIndex = 0;
  let match;
  while ((match = MARKDOWN_LINK.exec(text)) !== null) {
    if (caret >= match.index && caret <= match.index + match[0].length) return null;
  }

  let start = caret;
  while (start > 0 && !TOKEN_BOUNDARY.test(text[start - 1])) start -= 1;
  let end = caret;
  while (end < text.length && !TOKEN_BOUNDARY.test(text[end])) end += 1;
  if (end <= start) return null;

  const value = text.slice(start, end).replace(TRAILING_PUNCTUATION, "");
  const prefix = LINKABLE_PREFIX.exec(value);
  if (!prefix || value.length <= prefix[0].length) return null;
  if (!toSafeHref(value)) return null;

  return { start, end: start + value.length, value };
}

export function applyLinkSuggestion(text, token, label = SUGGESTION_LABEL) {
  const value = `${text.slice(0, token.start)}[${label}](${token.value})${text.slice(token.end)}`;
  const selectionStart = token.start + 1;

  return { value, selectionStart, selectionEnd: selectionStart + label.length };
}
