"use client";

import { useState } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { PackagePlus } from "lucide-react";

import { GhostComponent, Canvas, CanvasItem, DropSlot } from "./components/FormEditorComponents";
import { LibraryPanel, LibraryItem } from "./components/LibraryComponents";
import { LibrarySettings } from "./components/LibrarySettings";

import { COMPONENTS, REGISTRY } from "./form-registry";

const INITIAL_EDITORS = [
    { id: "owner", name: "egehavcu", email: "egehan@avcu.yedim", role: "Sahip", locked: true },
    { id: "editor", name: "kimbu", email: "x@std.yildiz.edu.tr", role: "Düzenleme" },
];

const LINKABLE_FORMS = [
    { id: "feedback", label: "Geri Bildirim Formu" },
    { id: "support", label: "Destek Talep Formu" },
];

export default function FormBuilder() {
    const [schema, setSchema] = useState([]);
    const [schemaTitle, setSchemaTitle] = useState("Yeni Form");
    const [dragSource, setDragSource] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [libraryTab, setLibraryTab] = useState("components");
    const [editors, setEditors] = useState(INITIAL_EDITORS);
    const [newEditor, setNewEditor] = useState("");
    const [linkedFormId, setLinkedFormId] = useState("");
    const [allowMultipleResponses, setAllowMultipleResponses] = useState(false);
    const [allowAnonymousResponses, setAllowAnonymousResponses] = useState(false);
    const [isAcceptingResponses, setIsAcceptingResponses] = useState(true);
    const [newEditorRole, setNewEditorRole] = useState("Görüntüleyici");

    const handleAddEditor = (event) => {
        event.preventDefault();
        const rawValue = newEditor.trim();
        if (!rawValue) return;
        const normalized = rawValue.includes("@") ? rawValue.split("@")[0] : rawValue;
        const formattedName = normalized.replace(/[\s._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
        const fallbackEmail = rawValue.includes("@") ? rawValue : `${rawValue.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@paylasim.local`;
        const id = Math.random().toString(36).slice(2, 10);
        setEditors((prev) => [ ...prev, { id, name: formattedName || fallbackEmail, email: fallbackEmail, role: "Görüntüleyici" } ]);
        setNewEditor("");
    };

    const handleRemoveEditor = (editor) => {
        if (editor.locked) return;
        setEditors((prev) => prev.filter((item) => item.id !== editor.id));
    };

    const handleChangeEditorRole = (editorId, nextRole) => {
        setEditors((prev) => prev.map((item) => item.id === editorId ? { ...item, role: nextRole } : item));
    };

    const linkedForm = LINKABLE_FORMS.find((form) => form.id === linkedFormId);

    const patchField = (id, nextProps) => {
        setSchema((prev) => prev.map((field) => (field.id === id ? { ...field, props: nextProps } : field)));
    };

    if (typeof window !== "undefined") {
        window.getFormSchema = () => structuredClone(schema);
    }

    return (
        <DndContext
            collisionDetection={pointerWithin}
            onDragStart={({ active }) => {
                const from = active.data?.current?.from ?? null;
                setDragSource(from);
                setActiveDragItem(active);
            }}
            onDragEnd={({ active, over }) => {
                const from = active.data?.current?.from;

                const getSlotIndex = (candidate) => {
                    if (!candidate?.id || typeof candidate.id !== "string") return null;
                    if (!candidate.id.startsWith("slot-")) return null;
                    const index = parseInt(candidate.id.split("slot-")[1], 10);
                    return Number.isNaN(index) ? null : index;
                };

                const slotIndex = getSlotIndex(over);

                if (from === "library") {
                    const type = active.data.current.type;
                    const id = Math.random().toString(36).slice(2, 10);
                    const props = structuredClone(REGISTRY[type]?.defaults ?? {});
                    if (over?.id !== "canvas" && slotIndex === null) return;
                    setSchema((prev) => {
                        if (slotIndex === null && over?.id === "canvas") {
                            return [...prev, { id, type, props }];
                        }
                        const next = [...prev];
                        next.splice(slotIndex, 0, { id, type, props });
                        return next;
                    });
                }
                if (from === "canvas" && over?.id === "library") {
                    const fieldId = active.data.current.id;
                    setSchema((prev) => prev.filter((field) => field.id !== fieldId));
                }
                if (from === "canvas" && slotIndex !== null) {
                    setSchema((prev) => {
                        const oldIndex = prev.findIndex((field) => field.id === active.id);
                        if (oldIndex === -1) return prev;
                        const item = prev[oldIndex];
                        const base = prev.filter((_, idx) => idx !== oldIndex);
                        const target = slotIndex > oldIndex ? slotIndex - 1 : slotIndex;
                        base.splice(target, 0, item);
                        return base;
                    });
                }
                if (from === "canvas" && over?.id && active.id !== over.id) {
                    setSchema((prev) => {
                        const oldIndex = prev.findIndex((field) => field.id === active.id);
                        const newIndex = prev.findIndex((field) => field.id === over.id);
                        if (oldIndex === -1 || newIndex === -1) return prev;
                        return arrayMove(prev, oldIndex, newIndex);
                    });
                }
                setDragSource(null);
                setActiveDragItem(null);
            }}
            onDragCancel={() => {
                setDragSource(null);
                setActiveDragItem(null);
            }}
        >
            <div className="grid grid-cols-12 gap-4">
                <Canvas dragSource={dragSource} schemaTitle={schemaTitle} setSchemaTitle={setSchemaTitle}>
                    {schema.length === 0 ? (
                        <div className="grid h-[80vh] place-items-center text-sm text-neutral-500">
                            <div>
                                <PackagePlus size={36} className="mx-auto my-4" />
                                <span className="font-semibold">Paletten sürükleyip kanvasa bırak</span>
                            </div>
                        </div>
                    ) : (
                        <SortableContext items={schema.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                            <ul className="flex flex-col gap-2 max-w-2xl mx-auto mb-4">
                                <DropSlot index={0} enabled={dragSource === "library"} />
                                {schema.map((field, index) => (
                                    <li key={field.id} className="flex flex-col">
                                        <CanvasItem field={field} index={index + 1} onPatch={patchField} />
                                        <DropSlot index={index + 1} enabled={dragSource === "library"} />
                                    </li>
                                ))}
                            </ul>
                        </SortableContext>
                    )}
                </Canvas>

                <LibraryPanel activeTab={libraryTab} onSelectTab={setLibraryTab}>
                    {libraryTab === "components" ? (
                        <div className="grid grid-cols-1 gap-2 p-2 space-y-1">
                            {COMPONENTS.map((component) => (
                                <LibraryItem key={component.type} item={component} />
                            ))}
                        </div>
                    ) : (
                        <LibrarySettings editors={editors}
                            onChangeEditorRole={handleChangeEditorRole}
                            handleAddEditor={handleAddEditor}
                            handleRemoveEditor={handleRemoveEditor}
                            newEditor={newEditor}
                            setNewEditor={setNewEditor}
                            newEditorRole={newEditorRole}
                            setNewEditorRole={setNewEditorRole}
                            setLinkedFormId={setLinkedFormId}
                            linkedFormId={linkedFormId}
                            isAcceptingResponses={isAcceptingResponses}
                            allowAnonymousResponses={allowAnonymousResponses}
                            setAllowAnonymousResponses={setAllowAnonymousResponses}
                            linkedForm={linkedForm}
                            setIsAcceptingResponses={setIsAcceptingResponses}
                            allowMultipleResponses={allowMultipleResponses}
                            setAllowMultipleResponses={setAllowMultipleResponses}
                            LINKABLE_FORMS={LINKABLE_FORMS}
                        />
                    )}
                </LibraryPanel>
            </div>

            <DragOverlay>
                {activeDragItem ? <GhostComponent active={activeDragItem} schema={schema} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
