"use client";

import { useRef, useState } from "react";
import { Bold, Code, Download, FileText, Heading2, Italic, Link, List, ListChecks, Table, Timer, Upload } from "lucide-react";
import TaskMarkdown from "@/app/components/rich-text/TaskMarkdown";
import { taskReadMinutes } from "@/app/components/rich-text/markdown";
import { durationText } from "@/lib/form-timing";
import { insertAtCursor } from "../form-editor/components/TaskCard";

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

export function TaskEditor({ task, onChange, onNotice }) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const content = task?.content ?? "";

  const importFile = (file) => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name) && !/^text\//.test(file.type)) {
      onNotice?.("Yalnızca .md ya da .txt dosyası içe aktarılabilir.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...task, content: String(reader.result ?? "") });
      onNotice?.(`${file.name} içe aktarıldı.`);
    };
    reader.onerror = () => onNotice?.("Dosya okunamadı.");
    reader.readAsText(file);
  };

  const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

  return (
    <div className="relative mt-3 overflow-hidden rounded-lg border border-white/10 bg-neutral-900/60"
      onDragOver={(event) => { if (!hasFiles(event)) return; event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={(event) => { if (!hasFiles(event)) return; event.preventDefault(); setDragging(false); importFile(event.dataTransfer.files?.[0]); }}
    >
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/10 px-1.5 py-1 text-neutral-500 scrollbar-hidden">
        {TOOLS.map((tool, index) => tool ? (
          <button key={tool.kind} type="button" title={tool.label} aria-label={tool.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => textareaRef.current && insertAtCursor(textareaRef.current, tool.kind)}
            className="grid size-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-white/5 hover:text-neutral-300"
          >
            <tool.Icon size={13} />
          </button>
        ) : (
          <span key={`divider-${index}`} className="mx-1 h-5 w-px shrink-0 bg-neutral-800" />
        ))}
        <span className="flex-1" />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-2xs transition-colors hover:bg-white/5 hover:text-neutral-200"
        >
          <Upload size={12} />
          .md içe aktar
        </button>
        <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden
          onChange={(event) => { importFile(event.target.files?.[0]); event.target.value = ""; }}
        />
      </div>
      <textarea ref={textareaRef} value={content} spellCheck={false} autoFocus
        onChange={(event) => onChange({ ...task, content: event.target.value })}
        onKeyDown={(event) => {
          if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return;
          const key = event.key.toLowerCase();
          if (key === "b") { event.preventDefault(); insertAtCursor(event.currentTarget, "bold"); }
          if (key === "i") { event.preventDefault(); insertAtCursor(event.currentTarget, "italic"); }
        }}
        aria-label="Görev metni, Markdown" placeholder="Görevi buraya yazın ya da .md dosyasını sürükleyin."
        className="block min-h-56 w-full resize-y bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-600"
      />
      {dragging && (
        <div className="pointer-events-none absolute inset-1.5 grid place-items-center rounded-lg border-2 border-dashed border-skylab-400/50 bg-neutral-900/95 text-xs font-medium text-skylab-300">
          Bırakın, metin içe aktarılsın
        </div>
      )}
    </div>
  );
}

export default function StudioTask({ task, timeLimitMinutes, selected, editable = true, phone = false, onPointerDown, onChange, onNotice }) {
  const content = task?.content ?? "";

  return (
    <div data-task onPointerDown={editable ? onPointerDown : undefined}
      className={`relative rounded-xl transition-[box-shadow] duration-150 ${phone ? "-mx-1 p-1" : "-mx-2 p-2"} ${
        !editable ? "" : selected ? "ring-2 ring-skylab-400/50" : "hover:ring-1 hover:ring-white/15"
      }`}
    >
      <div className="px-2 md:px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/5 pb-3 text-2xs text-neutral-500">
          {timeLimitMinutes ? (
            <span className="inline-flex items-center gap-1.5"><Timer size={12} />{durationText(timeLimitMinutes)} süre</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5"><FileText size={12} />{taskReadMinutes(content)} dk okuma</span>
          {task?.downloadable !== false ? (
            <span className="ml-auto inline-flex items-center gap-1.5 text-neutral-300 underline decoration-white/20 underline-offset-3"><Download size={12} />İndir</span>
          ) : null}
        </div>
        {editable && selected ? (
          <TaskEditor task={task} onChange={onChange} onNotice={onNotice} />
        ) : content.trim() ? (
          <div className="pt-4"><TaskMarkdown content={content} /></div>
        ) : (
          <p className="pt-4 text-sm text-neutral-500">Görev metni boş. Tıklayıp Markdown ile yazın.</p>
        )}
      </div>
    </div>
  );
}
