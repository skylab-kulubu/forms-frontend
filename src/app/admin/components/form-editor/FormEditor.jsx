"use client";

import { useState, useEffect } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { PackagePlus } from "lucide-react";
import dynamic from "next/dynamic";

import { GhostComponent, Canvas, CanvasItem, DropSlot } from "./components/FormEditorComponents";
import { LibraryPanel, LibraryItem } from "./components/LibraryComponents";
import { LibrarySettings } from "./components/LibrarySettings";
import { useFormMutation, useUserFormsQuery } from "@/lib/hooks/useFormAdmin";

import { COMPONENTS, REGISTRY } from "../../../components/form-registry";

const LibraryTipTap = dynamic(() => import("./components/LibraryTipTap").then((mod) => ({ default: mod.LibraryTipTap })), { ssr: false });

const FIXED_USER_ID = "11111111-1111-1111-1111-111111111111";
const formId = crypto.randomUUID();

const INITIAL_EDITORS = [
    { id: FIXED_USER_ID, name: "Skylab Kişisi", email: "forms@skylab.com", role: 3, locked: true }
];

export default function FormEditor({ initialForm = null }) {
    const [schema, setSchema] = useState(initialForm?.schema || []);
    const [schemaTitle, setSchemaTitle] = useState(initialForm?.title || "Yeni Form");
    const [description, setDescription] = useState(initialForm?.description || "");
    const [linkedFormId, setLinkedFormId] = useState(initialForm?.linkedFormId || "");
    const [allowMultipleResponses, setAllowMultipleResponses] = useState(initialForm?.allowMultipleResponses || false);
    const [allowAnonymousResponses, setAllowAnonymousResponses] = useState(initialForm?.allowAnonymousResponses || false);
    const [editors, setEditors] = useState(initialForm?.Collaborators || INITIAL_EDITORS);
    const [status, setStatus] = useState(initialForm?.status || 1);
    const [dragSource, setDragSource] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [libraryTab, setLibraryTab] = useState("components");
    const [newEditor, setNewEditor] = useState("");
    const [newEditorRole, setNewEditorRole] = useState(1);

    const { mutate: saveForm, isPending, error, isSuccess, isError, reset } = useFormMutation();
    const { data: userForms, isLoading: isUserFormsLoading } = useUserFormsQuery();

    const LINKABLE_FORMS = (userForms ?? [])
        .filter((form) => (form.id) !== initialForm?.id)
        .map((form) => ({
            id: form.id,
            label: form.title ?? "--",
        }));

    useEffect(() => {
        if (!isError && !isSuccess) return;

        const timer = setTimeout(() => {
            reset();
        }, 2000);

        return () => clearTimeout(timer);
    }, [isError, isSuccess, reset]);

    const handleSave = () => {
        const payload = {
            Id: initialForm?.id || formId || null,
            Title: schemaTitle,
            Description: description,
            Schema: schema,
            Status: status,
            AllowMultipleResponses: allowAnonymousResponses ? true : allowMultipleResponses,
            AllowAnonymousResponses: allowAnonymousResponses,
            LinkedFormId: allowAnonymousResponses ? null : (linkedFormId || null),
            Collaborators: editors.filter(editor => !editor.locked).map(editor => ({
                Email: editor.email,
                Role: editor.role
            }))
        };
        saveForm(payload);
    };


    const handleAddEditor = (event) => {
        event.preventDefault();
        const rawValue = newEditor.trim();
        if (!rawValue) return;
        const normalized = rawValue.includes("@") ? rawValue.split("@")[0] : rawValue;
        const formattedName = normalized.replace(/[\s._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
        const fallbackEmail = rawValue.includes("@") ? rawValue : `${rawValue.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@paylasim.local`;
        const id = Math.random().toString(36).slice(2, 10);
        setEditors((prev) => [...prev, { id, name: formattedName || fallbackEmail, email: fallbackEmail, role: "Görüntüleyici" }]);
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

                <LibraryPanel activeTab={libraryTab} onSelectTab={setLibraryTab} handleSave={handleSave} isPending={isPending} isSuccess={isSuccess} isError={isError}>
                    {libraryTab === "components" ? (
                        <div className="grid grid-cols-1 gap-2 p-2 space-y-1">
                            {COMPONENTS.map((component) => (
                                <LibraryItem key={component.type} item={component} />
                            ))}
                        </div>
                    ) : libraryTab === "settings" ? (
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
                            status={status}
                            allowAnonymousResponses={allowAnonymousResponses}
                            setAllowAnonymousResponses={setAllowAnonymousResponses}
                            linkedForm={linkedForm}
                            setStatus={setStatus}
                            allowMultipleResponses={allowMultipleResponses}
                            setAllowMultipleResponses={setAllowMultipleResponses}
                            LINKABLE_FORMS={LINKABLE_FORMS}
                        />
                    ) : (
                        <div className="flex h-full min-h-0 flex-col gap-4 p-4 text-sm text-neutral-200">
                            <section className="flex flex-1 min-h-0 flex-col gap-4">
                                <div>
                                    <p className="font-semibold text-neutral-100">Form açıklaması</p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                                        Formu görüntüleyen kişiler için kısa bir açıklama ekleyin.
                                    </p>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <LibraryTipTap value={description} onChange={setDescription} />
                                </div>
                            </section>
                        </div>
                    )}
                </LibraryPanel>
            </div>

            <DragOverlay>
                {activeDragItem ? <GhostComponent active={activeDragItem} schema={schema} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
