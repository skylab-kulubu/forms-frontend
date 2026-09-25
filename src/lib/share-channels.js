import { publicShortUrl } from "./short-url";

export const SHARE_FORMAT_KEY = "skyforms:share-format";
export const RESERVED_ALIASES = ["v1", "health", "go", "urls", "api", "docs", "c"];
export const MAX_ALIAS_LENGTH = 64;

export const SHARE_CHANNELS = [
  { key: "general", label: "Genel" },
  { key: "instagram", label: "Instagram", source: "instagram", code: "ig" },
  {
    key: "whatsapp", label: "WhatsApp", source: "whatsapp", code: "wa", openLabel: "WhatsApp'ta aç",
    openUrl: (url) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  },
  {
    key: "linkedin", label: "LinkedIn", source: "linkedin", code: "li", openLabel: "LinkedIn'de aç",
    openUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "email", label: "E-posta", source: "email", code: "mail", openLabel: "E-postada aç",
    openUrl: (url, title) => `mailto:?subject=${encodeURIComponent(title || "")}&body=${encodeURIComponent(url)}`,
  },
  { key: "website", label: "Web sitesi", source: "website", code: "web" },
  { key: "other", label: "Diğer" },
];

const SOURCE_LABELS = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  email: "E-posta",
  website: "Web sitesi",
  qr: "QR · afiş",
  x: "X",
};

export function channelByKey(key) {
  return SHARE_CHANNELS.find((channel) => channel.key === key) ?? SHARE_CHANNELS[0];
}

export function sourceLabel(source) {
  if (!source) return "Etiketsiz";
  return SOURCE_LABELS[source] ?? source;
}

const TURKISH = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u" };

export function slugifyAlias(raw) {
  return String(raw || "")
    .replace(/[ıİşŞğĞüÜöÖçÇâÂîÎûÛ]/g, (ch) => TURKISH[ch])
    .toLowerCase()
    .replace(/[\s.]+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+/, "")
    .replace(/[-_]+$/, "");
}

const DEFAULT_ALIAS_TITLE_LENGTH = 32;

export function defaultAliasFromTitle(title, year = new Date().getFullYear()) {
  let slug = String(title || "")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\p{Mn}'’]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length > DEFAULT_ALIAS_TITLE_LENGTH) {
    const cut = slug.lastIndexOf("-", DEFAULT_ALIAS_TITLE_LENGTH);
    slug = (cut > 0 ? slug.slice(0, cut) : slug.slice(0, DEFAULT_ALIAS_TITLE_LENGTH)).replace(/-+$/, "");
  }
  if (!slug) slug = "form";
  return slug.split("-").some((part) => /^(19|20)\d{2}$/.test(part)) ? slug : `${slug}-${year}`;
}

export function suggestAliases(base, current) {
  const year = String(new Date().getFullYear()).slice(-2);
  return [`${base}-${year}`, `${base}-20${year}`, `${base}-ytu`, `${base}-2`]
    .filter((alias) => alias.length <= MAX_ALIAS_LENGTH && alias !== current)
    .slice(0, 3);
}

export function channelTag(channelKey, { format = "suffix", customSource = "", campaign = "", content = "" } = {}) {
  const channel = channelByKey(channelKey);
  if (channel.key === "general") return "";
  const source = channel.key === "other" ? slugifyAlias(customSource) : channel.source;
  if (!source) return "";
  const extra = [];
  const campaignTag = slugifyAlias(campaign);
  const contentTag = slugifyAlias(content);
  if (campaignTag) extra.push(`utm_campaign=${campaignTag}`);
  if (contentTag) extra.push(`utm_content=${contentTag}`);
  if (format === "suffix" && channel.code) {
    return `/${channel.code}${extra.length ? `?${extra.join("&")}` : ""}`;
  }
  return `?${[`utm_source=${source}`, ...extra].join("&")}`;
}

export function taggedShortUrl(alias, tag = "") {
  const base = publicShortUrl(alias);
  return base ? `${base}${tag}` : "";
}
