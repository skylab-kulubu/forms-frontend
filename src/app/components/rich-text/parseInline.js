const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

const BARE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BARE_DOMAIN = /^[\w-]+(?:\.[\w-]+)+(?:[:/?#]|$)/;

export function toSafeHref(raw) {
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value) return null;

  const candidate = BARE_EMAIL.test(value)
    ? `mailto:${value}`
    : BARE_DOMAIN.test(value)
      ? `https://${value}`
      : value;

  try {
    const url = new URL(candidate);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function linkNode(href, text) {
  return { type: "link", href, text };
}

function textNode(text) {
  return { type: "text", text };
}

const INLINE_RULES = [
  {
    name: "markdown-link",
    pattern: /\[([^\]\n]+)\]\(([^\s)]+)\)/g,
    build: ([, label, target]) => {
      const href = toSafeHref(target);
      return href ? linkNode(href, label) : textNode(label);
    },
  },
  {
    name: "url",
    pattern: /(?:https?:\/\/|www\.)[^\s<>()[\]{}'"“”‘’]*[^\s<>()[\]{}'"“”‘’.,;:!?]/gi,
    build: ([raw]) => {
      const href = toSafeHref(raw);
      return href ? linkNode(href, raw) : textNode(raw);
    },
  },
  {
    name: "email",
    pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
    build: ([raw]) => {
      const href = toSafeHref(raw);
      return href ? linkNode(href, raw) : textNode(raw);
    },
  },
];

export function parseInline(text) {
  if (typeof text !== "string" || text.length === 0) return [];

  const nodes = [];
  let cursor = 0;

  while (cursor < text.length) {
    let best = null;

    for (const rule of INLINE_RULES) {
      rule.pattern.lastIndex = cursor;
      const match = rule.pattern.exec(text);
      if (match && (best === null || match.index < best.match.index)) {
        best = { rule, match };
      }
    }

    if (best === null) break;

    if (best.match.index > cursor) {
      nodes.push(textNode(text.slice(cursor, best.match.index)));
    }

    nodes.push(best.rule.build(best.match));
    cursor = best.match.index + best.match[0].length;
  }

  if (cursor < text.length) {
    nodes.push(textNode(text.slice(cursor)));
  }

  return nodes;
}
