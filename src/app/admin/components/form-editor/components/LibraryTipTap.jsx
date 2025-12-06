import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import { Bold, Heading1, Heading2, Italic, List, ListOrdered, Quote, Redo2, Underline as UnderlineIcon, Undo2 } from "lucide-react";

export function LibraryTipTap({ value = "", onChange }) {
    const [, forceTick] = useState(0);
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Underline,
            Strike,
        ],
        content: value || "",
        editorProps: {
            attributes: {
                class: "min-h-[120px] rounded-xl bg-neutral-900/40 px-3 py-2 text-sm leading-relaxed text-neutral-100 focus:outline-none",
            },
        },
        onUpdate({ editor }) {
            onChange?.(editor.getHTML());
        },
    });

    const placeholder = "Bu alana form açıklamasını girin. Açıklama, formun ne hakkında olduğunu ve kullanıcıların ne bekleyebileceğini belirtmek için kullanılır.";
    const showPlaceholder = editor ? editor.isEmpty : !(value && value.replace(/<[^>]*>/g, "").trim());

    useEffect(() => {
        if (!editor) return;
        const rerender = () => forceTick((prev) => prev + 1);
        editor.on("transaction", rerender);
        return () => editor.off("transaction", rerender);
    }, [editor]);

    useEffect(() => {
        if (!editor) return;
        const next = value || "";
        if (next === editor.getHTML()) return;
        editor.commands.setContent(next, false);
    }, [value, editor]);

    const toolbar = [
        { name: "undo", icon: Undo2, label: "Geri al", handler: () => editor?.chain().focus().undo().run(), disabled: () => !editor?.can().undo() },
        { name: "redo", icon: Redo2, label: "İleri al", handler: () => editor?.chain().focus().redo().run(), disabled: () => !editor?.can().redo() },
        { type: "separator" },
        { name: "bold", icon: Bold, label: "Kalın", handler: () => editor?.chain().focus().toggleBold().run(), isActive: () => editor?.isActive("bold") },
        { name: "italic", icon: Italic, label: "İtalik", handler: () => editor?.chain().focus().toggleItalic().run(), isActive: () => editor?.isActive("italic") },
        { name: "underline", icon: UnderlineIcon, label: "Altı çizili", handler: () => editor?.chain().focus().toggleUnderline().run(), isActive: () => editor?.isActive("underline") },
        { type: "separator" },
        { name: "heading1", icon: Heading1, label: "Başlık 1", handler: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor?.isActive("heading", { level: 1 }) },
        { name: "heading2", icon: Heading2, label: "Başlık 2", handler: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor?.isActive("heading", { level: 2 }) },
        { name: "heading3", icon: Heading2, label: "Başlık 3", handler: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor?.isActive("heading", { level: 3 }) },
        { type: "separator" },
        { name: "bulletList", icon: List, label: "Liste", handler: () => editor?.chain().focus().toggleBulletList().run(), isActive: () => editor?.isActive("bulletList") },
        { name: "orderedList", icon: ListOrdered, label: "Sıralı", handler: () => editor?.chain().focus().toggleOrderedList().run(), isActive: () => editor?.isActive("orderedList") },
        { name: "blockquote", icon: Quote, label: "Alıntı", handler: () => editor?.chain().focus().toggleBlockquote().run(), isActive: () => editor?.isActive("blockquote") },
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60 p-1 px-2 scrollbar-thin">
                {toolbar.map((item, index) => {
                    if (item.type === "separator") {
                        return <span key={`sep-${index}`} className="mx-1 h-5 w-px shrink-0 bg-neutral-800" />;
                    }
                    const active = item.isActive?.() ?? false;
                    const disabled = item.disabled?.() ?? false;
                    return (
                        <button key={item.name} type="button" onClick={item.handler} title={item.label} aria-label={item.label} disabled={disabled}
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition ${active ? "bg-white/15 text-neutral-100" : "hover:bg-white/5 hover:text-neutral-200"} ${disabled ? "cursor-not-allowed opacity-30 hover:bg-transparent" : ""}`}
                        >
                            <item.icon size={13} />
                        </button>
                    );
                })}
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-1 shadow-inner shadow-black/30">
                {showPlaceholder && (
                    <span className="pointer-events-none absolute inset-0 px-4 py-3 text-sm leading-relaxed text-neutral-600">{placeholder}</span>
                )}                
                <EditorContent editor={editor} className="h-full w-full overflow-y-auto pr-1 text-sm leading-relaxed text-neutral-100 scrollbar [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-700 [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:marker:text-neutral-400 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold" />
            </div>
        </div>
    );
}
