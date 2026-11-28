import { contrast, oklch, parseColor, toHex } from "./color";
import { BRAND_FONTS } from "./fonts";

const KEY = /^[a-z0-9-]{1,32}$/;
const LENGTH = /^\d+(?:\.\d+)?(?:px|rem)$/;
const PUBLIC_PATH = /^\/(?!\/)/;
const THEMES = ["dark"];
const SHAPES = ["round", "square", "cut"];
const FIELDS = ["name", "site", "icon", "theme", "shape", "fonts", "colors", "neutrals", "cardTopSpace"];
const COLORS = ["background", "accent", "accentSoft", "highlight", "highlightSoft", "text", "heading", "field", "onAccent", "onHighlight"];
const FONT_ROLES = ["body", "display"];
const NEUTRAL_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const NEUTRAL_LIGHTNESS = [0.985, 0.97, 0.922, 0.87, 0.708, 0.556, 0.439, 0.371, 0.269, 0.205, 0.145];
const NEUTRAL_TINT = [0.3, 0.6, 0.9, 1.3, 1.8, 1.9, 2, 2, 1.8, 1.4, 1];
const RADII = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
const RAMPS = {
  "--skylab": [[300, 0.08, 0.5, 0], [400, 0.04, 0.714, 0], [500], [600, -0.09, 1.143, 2], [700, -0.19, 1.214, 4], [800, -0.3, 1.143, 6], [900, -0.4, 0.929, 8]],
  "--color-pink": [[100, 0.1, 0.357, 0], [200, 0.06, 0.571, 0], [300, 0.03, 0.786, 0], [400], [500, -0.07, 1.071, 2], [600, -0.16, 1.143, 4]],
  "--color-sky": [[300, 0.05, 0.714, 0], [400], [500, -0.07, 1.071, 2]],
};
const CONTRAST = [
  ["text", "background", 4.5],
  ["heading", "background", 4.5],
  ["accentSoft", "background", 3],
  ["highlightSoft", "background", 3],
  ["onAccent", "accentSoft", 4.5],
  ["onHighlight", "highlightSoft", 4.5],
];

const list = (values) => values.map((value) => `"${value}"`).join(", ");
const hue = (color) => Math.round(color.h);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const isRecord = (value) => value != null && typeof value === "object" && !Array.isArray(value);
const block = (selector, entries) => `${selector}{${entries.map(([property, value]) => `${property}:${value}`).join(";")}}`;

function hashOf(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  return (hash >>> 0).toString(36);
}

export function buildBrand(key, definition) {
  const fail = (message) => {
    throw new Error(`Brand "${key}": ${message}`);
  };
  if (!KEY.test(key)) fail("the key must be 1 to 32 lowercase letters, digits or dashes");
  if (!isRecord(definition)) fail("brand.js must export an object");

  const { name, site = null, icon = null, theme = "dark", shape = "round", fonts = {}, colors, neutrals = null, cardTopSpace = null } = definition;
  const unknown = Object.keys(definition).filter((field) => !FIELDS.includes(field));
  if (unknown.length) fail(`unknown field ${list(unknown)}`);
  if (typeof name !== "string" || !name.trim()) fail("name is required");
  if (!THEMES.includes(theme)) fail(`theme must be ${list(THEMES)}`);
  if (!SHAPES.includes(shape)) fail(`shape must be one of ${list(SHAPES)}`);
  if (icon != null && (typeof icon !== "string" || !PUBLIC_PATH.test(icon))) fail("icon must be a path under public/, starting with a single /");
  if (cardTopSpace != null && !LENGTH.test(String(cardTopSpace))) fail("cardTopSpace must be a length such as 2.5rem or 40px");
  if (!isRecord(colors)) fail("colors is required: an object with at least background and accent");
  if (!isRecord(fonts)) fail(`fonts must be an object with ${list(FONT_ROLES)}`);

  let siteLabel = null;
  if (site != null) {
    let url = null;
    try {
      url = new URL(site);
    } catch {
      url = null;
    }
    if (url?.protocol !== "https:") fail("site must be an https address");
    siteLabel = url.host;
  }

  const unknownColors = Object.keys(colors).filter((field) => !COLORS.includes(field));
  if (unknownColors.length) fail(`unknown colour ${list(unknownColors)}; the engine knows ${list(COLORS)}`);
  const given = (field) => (colors[field] == null ? null : parseColor(colors[field]) ?? fail(`colors.${field} must be a #hex or oklch() colour`));

  const background = given("background") ?? fail("colors.background is required");
  const accent = given("accent") ?? fail("colors.accent is required");
  const highlight = given("highlight") ?? accent;
  const palette = {
    background,
    accent,
    highlight,
    accentSoft: given("accentSoft") ?? oklch(0.85, 0.07, hue(accent)),
    highlightSoft: given("highlightSoft") ?? oklch(0.86, 0.085, hue(highlight)),
    text: given("text") ?? oklch(0.92, Math.min(background.c * 1.8, 0.02), hue(background)),
    heading: given("heading") ?? oklch(0.945, Math.min(background.c * 0.75, 0.01), hue(background)),
    field: given("field") ?? oklch(background.l + 0.053, background.c * 1.3, hue(background)),
    onAccent: given("onAccent") ?? oklch(0.24, Math.min(accent.c * 0.3, 0.04), hue(accent)),
    onHighlight: given("onHighlight") ?? oklch(0.19, Math.min(highlight.c * 0.19, 0.03), hue(highlight)),
  };

  if (neutrals != null && (!Array.isArray(neutrals) || neutrals.length !== NEUTRAL_STEPS.length)) {
    fail(`neutrals must list ${NEUTRAL_STEPS.length} colours, from 50 to 950`);
  }
  const tint = Math.min(background.c, 0.02);
  const neutral = NEUTRAL_STEPS.map((step, index) => (neutrals
    ? parseColor(neutrals[index]) ?? fail(`neutrals[${index}] (${step}) must be a #hex or oklch() colour`)
    : oklch(NEUTRAL_LIGHTNESS[index], tint * NEUTRAL_TINT[index], hue(background))));

  const unknownFonts = Object.keys(fonts).filter((role) => !FONT_ROLES.includes(role));
  if (unknownFonts.length) fail(`unknown font role ${list(unknownFonts)}; use ${list(FONT_ROLES)}`);
  const pick = (role) => {
    const family = fonts[role];
    if (family == null) return null;
    if (!Object.hasOwn(BRAND_FONTS, family)) fail(`fonts.${role} "${family}" is not in src/brands/fonts/index.js; the list has ${list(Object.keys(BRAND_FONTS))}`);
    return BRAND_FONTS[family].style.fontFamily;
  };
  const body = pick("body");
  const display = pick("display");

  const soft = palette.accentSoft;
  const ramp = (prefix, [step, lightness, chroma, drift]) => [
    `${prefix}-${step}`,
    lightness == null ? soft.css : oklch(clamp(soft.l + lightness, 0, 1), clamp(soft.c * chroma, 0, 0.4), hue(soft) + drift).css,
  ];
  const shared = [
    ["--brand-background", background.css],
    ["--brand-accent", accent.css],
    ["--brand-highlight", highlight.css],
    ["--brand-highlight-soft", palette.highlightSoft.css],
    ["--brand-on-highlight", palette.onHighlight.css],
    ["--brand-heading", palette.heading.css],
    ["--brand-edge", `color-mix(in oklab, ${palette.heading.css} 12%, transparent)`],
    ["--brand-paper", "rgb(255 255 255 / 0.035)"],
    ...Object.entries(RAMPS).flatMap(([prefix, steps]) => steps.map((entry) => ramp(prefix, entry))),
    ...(shape === "round" ? [] : RADII.map((size) => [`--radius-${size}`, "0px"])),
    ...(body ? [["--font-sans", `${body}, system-ui, sans-serif`]] : []),
    ...(display ? [["--font-display", `${[display, body].filter(Boolean).join(", ")}, sans-serif`]] : []),
    ["--studio-glow", "var(--skylab-500)"],
  ];
  const page = [
    ["--color-white", palette.text.css],
    ["--forms-ink", palette.text.css],
    ["--forms-ink-rgb", palette.text.rgb.join(" ")],
    ...NEUTRAL_STEPS.map((step, index) => [`--color-neutral-${step}`, neutral[index].css]),
    ["--sl-bg", background.css],
    ["--bg-tint", accent.rgb.join(", ")],
    ["--bg-tint-deep", accent.rgb.join(", ")],
    ["--primary", "var(--skylab-500)"],
    ["--primary-foreground", palette.onAccent.css],
    ["--ring", `color-mix(in oklab, ${accent.css} 60%, transparent)`],
    ["--input-background", palette.field.css],
    ...(cardTopSpace == null ? [] : [["--brand-card-top-space", String(cardTopSpace)]]),
  ];
  const css = [block(`:root [data-brand="${key}"]`, shared), block(`:root [data-brand="${key}"]:not([data-brand-paper])`, page)].join("\n");

  return {
    key,
    name: name.trim(),
    siteUrl: site,
    siteLabel,
    icon,
    theme,
    themeColor: toHex(background.rgb),
    attributes: {
      "data-brand": key,
      "data-brand-shape": shape,
      ...(display ? { "data-brand-display": "" } : {}),
    },
    css,
    styleHref: `brand-${key}-${hashOf(css)}`,
    fontLoads: [
      ...(display ? [`700 26px ${display}`] : []),
      ...(body ? [`400 16px ${body}`, `600 16px ${body}`] : []),
    ],
    warnings: [
      ...(background.l > 0.3 ? [`background is light for a dark theme (OKLCH lightness ${background.l.toFixed(2)}, keep it under 0.3); surfaces are drawn as light overlays and fade on it`] : []),
      ...CONTRAST.map(([front, back, minimum]) => [front, back, minimum, contrast(palette[front], palette[back])])
        .filter(([, , minimum, ratio]) => ratio < minimum)
        .map(([front, back, minimum, ratio]) => `${front} on ${back} reads at ${ratio.toFixed(2)}:1, under ${minimum}:1`),
    ],
  };
}
