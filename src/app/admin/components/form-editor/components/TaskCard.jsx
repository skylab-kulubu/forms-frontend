"use client";

export function insertAtCursor(textarea, kind) {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    const replace = (text, from, to) => {
        textarea.focus();
        textarea.setSelectionRange(from, to);
        let inserted = false;
        try { inserted = document.execCommand("insertText", false, text); } catch { inserted = false; }
        if (!inserted) {
            textarea.setRangeText(text, from, to, "end");
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
    };

    const wrap = (left, right, placeholder) => {
        const text = selected || placeholder;
        replace(left + text + right, start, end);
        textarea.setSelectionRange(start + left.length, start + left.length + text.length);
    };

    const prefix = (marker) => {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const endAt = end > start && value[end - 1] === "\n" ? end - 1 : end;
        let lineEnd = value.indexOf("\n", endAt);
        if (lineEnd === -1) lineEnd = value.length;
        const lines = value.slice(lineStart, lineEnd).split("\n").map((line) => marker + line).join("\n");
        replace(lines, lineStart, lineEnd);
    };

    switch (kind) {
        case "h2": prefix("## "); break;
        case "bold": wrap("**", "**", "kalın metin"); break;
        case "italic": wrap("_", "_", "italik metin"); break;
        case "ul": prefix("- "); break;
        case "task": prefix("- [ ] "); break;
        case "code":
            if (selected.includes("\n")) wrap("```\n", "\n```", "");
            else wrap("`", "`", "kod");
            break;
        case "link": {
            const text = selected || "bağlantı metni";
            replace(`[${text}](https://)`, start, end);
            const urlStart = start + text.length + 3;
            textarea.setSelectionRange(urlStart, urlStart + 8);
            break;
        }
        case "table": {
            const lead = start === 0 || value[start - 1] === "\n" ? "" : "\n\n";
            replace(`${lead}| Ölçüt | Ağırlık |\n| --- | --- |\n| Çalışıyor mu | %40 |\n`, start, end);
            break;
        }
        default:
            break;
    }
}
