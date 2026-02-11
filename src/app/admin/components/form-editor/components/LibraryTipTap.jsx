"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import { Bold, Heading1, Heading2, Italic, List, ListOrdered, Quote, Redo2, Underline as UnderlineIcon, Undo2, Strikethrough } from "lucide-react";
import { useFormEditor } from "../FormEditorContext";

export function LibraryTipTap() {
    const { state, dispatch } = useFormEditor();
    const { description } = state;

    const [isEditorEmpty, setIsEditorEmpty] = useState(!description || description === "<p></p>");

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
        editorProps: {
            attributes: {
                class: "min-h-[120px] rounded-xl bg-neutral-900/40 px-3 py-2 text-sm leading-relaxed text-neutral-100 focus:outline-none",
            },
        },
        content: description || "",
        onUpdate({ editor }) {
            const html = editor.getHTML();
            const isEmpty = editor.isEmpty;
            setIsEditorEmpty(isEmpty);
            const value = html === "<p></p>" ? "" : html;
            dispatch({ type: "SET_DESCRIPTION", payload: value });
        },
    });

    useEffect(() => {
        if (editor && description !== editor.getHTML()) {
            if (description === "" && editor.getHTML() === "<p></p>") return;
            editor.commands.setContent(description);
        }
    }, [description, editor]);

    const placeholder = "Bu alana form açıklamasını girin. Açıklama, formun ne hakkında olduğunu ve kullanıcıların ne bekleyebileceğini belirtmek için kullanılır.";

    if (!editor) {
        return null;
    }

    const buttons = [
        { 
            icon: Bold, 
            label: "Kalın", 
            handler: () => editor.chain().focus().toggleBold().run(), 
            isActive: editor.isActive("bold") 
        },
        { 
            icon: Italic, 
            label: "İtalik", 
            handler: () => editor.chain().focus().toggleItalic().run(), 
            isActive: editor.isActive("italic") 
        },
        { 
            icon: UnderlineIcon, 
            label: "Altı Çizili", 
            handler: () => editor.chain().focus().toggleUnderline().run(), 
            isActive: editor.isActive("underline") 
        },
        { 
            icon: Strikethrough, 
            label: "Üstü Çizili", 
            handler: () => editor.chain().focus().toggleStrike().run(), 
            isActive: editor.isActive("strike") 
        },
        { type: "divider" },
        { 
            icon: Heading1, 
            label: "Başlık 1", 
            handler: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 
            isActive: editor.isActive("heading", { level: 1 }) 
        },
        { 
            icon: Heading2, 
            label: "Başlık 2", 
            handler: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 
            isActive: editor.isActive("heading", { level: 2 }) 
        },
        { type: "divider" },
        { 
            icon: List, 
            label: "Liste", 
            handler: () => editor.chain().focus().toggleBulletList().run(), 
            isActive: editor.isActive("bulletList") 
        },
        { 
            icon: ListOrdered, 
            label: "Sıralı Liste", 
            handler: () => editor.chain().focus().toggleOrderedList().run(), 
            isActive: editor.isActive("orderedList") 
        },
        { type: "divider" },
        { 
            icon: Quote, 
            label: "Alıntı", 
            handler: () => editor.chain().focus().toggleBlockquote().run(), 
            isActive: editor.isActive("blockquote") 
        },
        { type: "divider" },
        { 
            icon: Undo2, 
            label: "Geri Al", 
            handler: () => editor.chain().focus().undo().run(), 
            disabled: !editor.can().undo() 
        },
        { 
            icon: Redo2, 
            label: "İleri Al", 
            handler: () => editor.chain().focus().redo().run(), 
            disabled: !editor.can().redo() 
        },
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60 p-1 px-2 scrollbar-hidden">
                {buttons.map((item, index) => {
                    if (item.type === "divider") {
                        return <span key={`sep-${index}`} className="mx-1 h-5 w-px shrink-0 bg-neutral-800" />;
                    }
                    
                    const active = item.isActive;
                    const disabled = item.disabled;

                    return (
                        <button key={index} type="button" onClick={item.handler}
                            title={item.label} aria-label={item.label} disabled={disabled}
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition 
                                ${active ? "bg-white/15 text-neutral-100" : "hover:bg-white/5 hover:text-neutral-200"} 
                                ${disabled ? "cursor-not-allowed opacity-30 hover:bg-transparent" : ""}
                            `}
                        >
                            <item.icon size={13} />
                        </button>
                    );
                })}
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-1 shadow-inner shadow-black/30">
                {isEditorEmpty && (
                    <span className="pointer-events-none absolute inset-0 px-4 py-3 text-sm leading-relaxed text-neutral-600">
                        {placeholder}
                    </span>
                )}
                
                <EditorContent 
                    editor={editor} 
                    className="h-full w-full overflow-y-auto pr-1 text-sm leading-relaxed text-neutral-100 scrollbar 
                        [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-700 [&_blockquote]:pl-3 
                        [&_ol]:list-decimal [&_ol]:pl-5 
                        [&_ul]:list-disc [&_ul]:pl-5 
                        [&_li]:marker:text-neutral-400 
                        [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-neutral-50 [&_h1]:mb-2 
                        [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-neutral-100 [&_h2]:mb-1.5 
                        [&_p]:mb-1.5 last:[&_p]:mb-0" 
                />
            </div>
        </div>
    );
}