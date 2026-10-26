"use client";

const LINK_BUTTON = "underline underline-offset-3 transition-colors";

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

export function TaskRemoveConfirm({ onConfirm, onCancel }) {
    return (
        <span className="inline-flex items-center gap-2.5 text-2xs">
            <span className="text-neutral-300">Görev metni silinecek.</span>
            <button type="button" onClick={onConfirm} className={`${LINK_BUTTON} text-red-300 decoration-red-300/35 hover:decoration-red-300/80`}>
                Kaldır
            </button>
            <button type="button" onClick={onCancel} className={`${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}>
                Vazgeç
            </button>
        </span>
    );
}
