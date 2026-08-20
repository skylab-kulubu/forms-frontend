const MIRRORED_PROPERTIES = [
  "boxSizing", "width",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "fontVariant",
  "letterSpacing", "lineHeight", "textAlign", "textIndent", "textTransform",
  "whiteSpace", "wordSpacing", "wordBreak", "overflowWrap", "tabSize",
];

export function measureCaretOffset(textarea, position) {
  if (!textarea || typeof document === "undefined") return null;

  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");

  for (const property of MIRRORED_PROPERTIES) {
    mirror.style[property] = computed[property];
  }

  mirror.style.position = "absolute";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.height = "auto";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";

  mirror.textContent = textarea.value.slice(0, position);

  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(position) || ".";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  const height = parseFloat(computed.lineHeight) || marker.offsetHeight;
  document.body.removeChild(mirror);

  return { top, left, height };
}
