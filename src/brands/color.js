const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/;
const OKLCH = /^oklch\(\s*(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*\)$/;

const toLinear = (channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const toGamma = (channel) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);
const trim = (value, digits) => String(Number(value.toFixed(digits)));

function rgbToOklch(rgb) {
  const [r, g, b] = rgb.map((channel) => toLinear(channel / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: Math.hypot(a, bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

function oklchToRgb(l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((value) => value ** 3);
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ].map((channel) => Math.round(Math.min(1, Math.max(0, toGamma(channel))) * 255));
}

export function oklch(l, c, h) {
  const hue = ((h % 360) + 360) % 360;
  return { l, c, h: hue, css: `oklch(${trim(l, 4)} ${trim(c, 4)} ${trim(hue, 2)})`, rgb: oklchToRgb(l, c, hue) };
}

export function parseColor(value) {
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (HEX.test(text)) {
    const digits = text.length === 4 ? [...text.slice(1)].map((digit) => digit + digit).join("") : text.slice(1);
    const rgb = [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16));
    return { ...rgbToOklch(rgb), css: `#${digits}`, rgb };
  }
  const match = OKLCH.exec(text);
  if (!match) return null;
  const [l, c, h] = match.slice(1).map(Number);
  if (l > 1 || c > 0.4 || h > 360) return null;
  return oklch(l, c, h);
}

export function toHex(rgb) {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function contrast(first, second) {
  const luminance = ({ rgb }) => {
    const [r, g, b] = rgb.map((channel) => toLinear(channel / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
