"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bold, ClipboardList, Code, Heading2, Italic, Link, List, ListChecks, Pin, Table, Timer, Trash2, Upload } from "lucide-react";
import TaskMarkdown from "@/app/components/rich-text/TaskMarkdown";
import { PANEL_BOX } from "@/app/admin/components/utils/SidePanel";
import { durationText, formatLongDate } from "@/lib/form-timing";

const TOOLS = [
    { kind: "h2", label: "Başlık", Icon: Heading2 },
    { kind: "bold", label: "Kalın (Ctrl+B)", Icon: Bold },
    { kind: "italic", label: "İtalik (Ctrl+I)", Icon: Italic },
    null,
    { kind: "ul", label: "Liste", Icon: List },
    { kind: "task", label: "Görev listesi", Icon: ListChecks },
    null,
    { kind: "code", label: "Kod", Icon: Code },
    { kind: "link", label: "Bağlantı", Icon: Link },
    { kind: "table", label: "Tablo", Icon: Table },
];

const LINK_BUTTON = "underline underline-offset-3 transition-colors";

function TimingSummary({ timeLimitMinutes, closesAt }) {
    if (timeLimitMinutes) {
        return (
            <span>
                Kişisel süre: başlatınca <span className="text-neutral-300">{durationText(timeLimitMinutes)}</span>
                {closesAt ? ` · son başlama ${formatLongDate(closesAt)}` : ""}
            </span>
        );
    }

    if (closesAt) return <span>Kapanış: <span className="text-neutral-300">{formatLongDate(closesAt)}</span></span>;

    return <span>Süre yok; form sen kapatana kadar açık kalır.</span>;
}

function insertAtCursor(textarea, kind) {
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

function OnOffRow({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-xs text-neutral-300">{label}</span>
            <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
                <button type="button" aria-pressed={!value} onClick={() => onChange(false)}
                    className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${!value ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
                >
                    Hayır
                </button>
                <button type="button" aria-pressed={value} onClick={() => onChange(true)}
                    className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${value ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
                >
                    Evet
                </button>
            </div>
        </div>
    );
}

export default function TaskCard({ task, timing, flash = false, onChange, onRemove, onOpenTiming }) {
    const [mode, setMode] = useState("write");
    const [dragging, setDragging] = useState(false);
    const [notice, setNotice] = useState(null);
    const [confirmingRemove, setConfirmingRemove] = useState(false);
    const textareaRef = useRef(null);
    const fileRef = useRef(null);
    const preview = mode === "preview";
    const content = task?.content ?? "";

    const update = (patch) => onChange({ ...task, ...patch });

    const showNotice = (text) => {
        setNotice(text);
        setTimeout(() => setNotice(null), 2600);
    };

    const importFile = (file) => {
        if (!file) return;
        if (!/\.(md|markdown|txt)$/i.test(file.name) && !/^text\//.test(file.type)) {
            showNotice("Yalnızca .md ya da .txt dosyası içe aktarılabilir.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            update({ content: String(reader.result ?? "") });
            showNotice(`${file.name} içe aktarıldı.`);
        };
        reader.onerror = () => showNotice("Dosya okunamadı.");
        reader.readAsText(file);
    };

    const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const handleKeyDown = (event) => {
        if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return;
        const key = event.key.toLowerCase();
        if (key === "b") { event.preventDefault(); insertAtCursor(event.currentTarget, "bold"); }
        if (key === "i") { event.preventDefault(); insertAtCursor(event.currentTarget, "italic"); }
    };

    const requestRemove = () => {
        if (content.trim()) setConfirmingRemove(true);
        else onRemove();
    };

    return (
        <div className="relative" data-task-card>
            <div className={`mx-auto w-full max-w-2xl rounded-xl border shadow-lg transition-all duration-300 group relative bg-neutral-900 border-skylab-400/30 shadow-skylab-500/5 focus-within:border-skylab-400/40 ${flash ? "ring-3 ring-skylab-500/25" : ""}`}>
                <div className="flex min-h-12 items-center gap-3 border-b border-white/5 px-3 py-2.5">
                    <div className="grid size-6 place-items-center rounded-md border border-skylab-400/40 bg-skylab-500/10 text-xs font-semibold text-skylab-300">
                        <ClipboardList size={13} />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-sm font-medium text-neutral-200">Görev</span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-3xs text-neutral-400">
                            <Pin size={10} />
                            Formun başında
                        </span>
                    </div>
                    {confirmingRemove ? (
                        <div className="ml-auto">
                            <TaskRemoveConfirm onConfirm={onRemove} onCancel={() => setConfirmingRemove(false)} />
                        </div>
                    ) : (
                        <div className="ml-auto flex items-center">
                            <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
                                <button type="button" aria-pressed={!preview} onClick={() => setMode("write")}
                                    className={`px-2 py-1 text-2xs rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${!preview ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
                                >
                                    Yaz
                                </button>
                                <button type="button" aria-pressed={preview} onClick={() => setMode("preview")}
                                    className={`px-2 py-1 text-2xs rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${preview ? "bg-skylab-400/20 text-skylab-300" : "text-neutral-300 hover:text-neutral-200"}`}
                                >
                                    Önizle
                                </button>
                            </div>
                            <div className="mx-2 h-5 w-px bg-white/10" />
                            <button type="button" aria-label="Görevi kaldır" title="Görevi kaldır" onClick={requestRemove}
                                className="grid size-7 place-items-center rounded-lg border border-white/15 bg-white/5 text-neutral-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative z-0 flex flex-col gap-3 p-3 md:p-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="task-content" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Görev Metni</label>
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-2xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                            >
                                <Upload size={12} />
                                .md içe aktar
                            </button>
                            <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden
                                onChange={(event) => { importFile(event.target.files?.[0]); event.target.value = ""; }}
                            />
                        </div>

                        <div className={`${PANEL_BOX} relative overflow-hidden`}
                            onDragOver={(event) => { if (!hasFiles(event)) return; event.preventDefault(); setDragging(true); }}
                            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
                            onDrop={(event) => { if (!hasFiles(event)) return; event.preventDefault(); setDragging(false); importFile(event.dataTransfer.files?.[0]); }}
                        >
                            {!preview && (
                                <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-white/5 px-1.5 py-1 scrollbar-hidden">
                                    {TOOLS.map((tool, index) => tool ? (
                                        <button key={tool.kind} type="button" title={tool.label} aria-label={tool.label}
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => textareaRef.current && insertAtCursor(textareaRef.current, tool.kind)}
                                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition hover:bg-white/5 hover:text-neutral-200"
                                        >
                                            <tool.Icon size={13} />
                                        </button>
                                    ) : (
                                        <span key={`divider-${index}`} className="mx-1 h-5 w-px shrink-0 bg-neutral-800" />
                                    ))}
                                </div>
                            )}

                            {preview ? (
                                <div className="max-h-120 overflow-y-auto px-4 py-3.5 scrollbar">
                                    {content.trim()
                                        ? <TaskMarkdown content={content} />
                                        : <p className="text-sm italic text-neutral-500">Önizlenecek metin yok.</p>}
                                </div>
                            ) : (
                                <textarea id="task-content" ref={textareaRef} value={content} spellCheck={false}
                                    onChange={(event) => update({ content: event.target.value })} onKeyDown={handleKeyDown}
                                    aria-label="Görev metni, Markdown" placeholder="Görevi buraya yazın ya da .md dosyasını sürükleyin."
                                    className="block min-h-72 w-full resize-y bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-600"
                                />
                            )}

                            {dragging && (
                                <div className="pointer-events-none absolute inset-1.5 grid place-items-center rounded-lg border-2 border-dashed border-skylab-400/50 bg-neutral-900/95 text-xs font-medium text-skylab-300">
                                    Bırakın, metin içe aktarılsın
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-3 px-0.5 text-2xs text-neutral-500">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span key={notice ?? "hint"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                                    className={notice ? "text-skylab-300" : ""}
                                >
                                    {notice ?? "Başlık, liste, görev listesi, tablo, kod ve bağlantı desteklenir."}
                                </motion.span>
                            </AnimatePresence>
                            <span className="shrink-0 tabular-nums">{content.length.toLocaleString("tr-TR")} karakter</span>
                        </div>
                    </div>

                    <OnOffRow label="Uzun metni katla" value={task?.collapsible ?? true} onChange={(value) => update({ collapsible: value })} />
                    <OnOffRow label="Aday metni .md olarak indirebilsin" value={task?.downloadable ?? true} onChange={(value) => update({ downloadable: value })} />

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-2xs text-neutral-500">
                        <Timer size={12} className="shrink-0" />
                        <TimingSummary timeLimitMinutes={timing?.timeLimitMinutes ?? null} closesAt={timing?.closesAt ?? null} />
                        {onOpenTiming && (
                            <button type="button" onClick={onOpenTiming}
                                className={`ml-auto ${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
                            >
                                Ayarlar&apos;da değiştir
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
