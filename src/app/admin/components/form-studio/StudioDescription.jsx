"use client";

import { Fragment, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Underline as UnderlineIcon } from "lucide-react";
import { sanitizeFormHtml } from "@/app/components/rich-text/sanitizeHtml";

export const DESCRIPTION_CLASS = `text-sm leading-relaxed text-neutral-300
  [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-neutral-100 [&_em]:text-neutral-300
  [&_a]:text-skylab-300 [&_a]:underline [&_a]:decoration-skylab-300/30 [&_a]:underline-offset-2 [&_a]:wrap-break-word
  [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-100 [&_blockquote]:italic
  [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
  [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-neutral-100
  [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-100
  [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-neutral-100`;

export function DescriptionView({ html, className = "" }) {
  if (!html?.trim()) return null;
  return <div className={`${DESCRIPTION_CLASS} ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeFormHtml(html) }} />;
}

export default function StudioDescription({ value, onChange, placeholder = "Açıklama ekle", ref }) {
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(!value || value === "<p></p>");
  const lastValue = useRef(value || "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        },
      }),
    ],
    editorProps: { attributes: { class: "outline-none" } },
    content: value || "",
    onUpdate({ editor: current }) {
      const html = current.getHTML();
      const next = html === "<p></p>" ? "" : html;
      setEmpty(current.isEmpty);
      lastValue.current = next;
      onChange(next);
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = value || "";
    if (next === lastValue.current) return;
    lastValue.current = next;
    editor.commands.setContent(next);
  }, [value, editor]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (!editor || editor.isDestroyed) return false;
      editor.commands.focus("end");
      return true;
    },
  }), [editor]);

  const tools = editor ? [
    { icon: Bold, label: "Kalın", run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, label: "İtalik", run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: UnderlineIcon, label: "Altı çizili", run: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
    { icon: Heading2, label: "Başlık", run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: List, label: "Liste", run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, label: "Sıralı liste", run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Quote, label: "Alıntı", run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
  ] : [];

  return (
    <div className={`relative -mx-1 rounded-md px-1 transition-colors ${focused ? "bg-skylab-400/6 ring-3 ring-skylab-400/6" : ""}`}>
      {focused && (
        <div className="absolute right-0 top-full z-20 mt-1.5 flex items-center gap-0.5 rounded-lg border border-white/15 bg-neutral-900 px-1 py-0.5 shadow-lg">
          {tools.map((tool, index) => (
            <Fragment key={tool.label}>
              {index === 3 ? <span className="mx-0.5 h-4 w-px bg-white/10" /> : null}
              <button type="button" title={tool.label} aria-label={tool.label}
                onMouseDown={(event) => event.preventDefault()} onClick={tool.run}
                className={`grid size-6 place-items-center rounded-md transition-colors ${tool.active ? "bg-white/15 text-neutral-100" : "text-neutral-400 hover:bg-white/10 hover:text-neutral-200"}`}
              >
                <tool.icon size={13} />
              </button>
            </Fragment>
          ))}
        </div>
      )}
      {empty && !focused && (
        <span className="pointer-events-none absolute inset-x-1 top-0 text-sm text-neutral-500">{placeholder}</span>
      )}
      {editor ? (
        <EditorContent editor={editor} className={DESCRIPTION_CLASS} />
      ) : (
        <div className={DESCRIPTION_CLASS} dangerouslySetInnerHTML={{ __html: empty ? "<p><br></p>" : sanitizeFormHtml(value) }} />
      )}
    </div>
  );
}
