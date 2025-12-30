"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PackagePlus } from "lucide-react";
import dynamic from "next/dynamic";

import { GhostComponent, Canvas, CanvasItem, DropSlot } from "./components/FormEditorComponents";
import { LibraryPanel, LibraryItem } from "./components/LibraryComponents";
import { LibrarySettings } from "./components/LibrarySettings";
import { useDeleteFormMutation, useFormMutation, useLinkableFormsQuery } from "@/lib/hooks/useFormAdmin";
import ApprovalOverlay from "../ApprovalOverlay";

import { COMPONENTS, REGISTRY } from "../../../components/form-registry";

const LibraryTipTap = dynamic(() => import("./components/LibraryTipTap").then((mod) => ({ default: mod.LibraryTipTap })), { ssr: false });

const FIXED_USER_ID = "11111111-1111-1111-1111-111111111111";
const formId = crypto.randomUUID();

const INITIAL_EDITORS = [
    { userId: FIXED_USER_ID, fullName: "Skylab Ki?isi", email: "forms@skylab.com", role: 3, photoUrl: null }
];

export default function FormEditor({ initialForm = null, onRefresh }) {
    const router = useRouter();
    const [schema, setSchema] = useState(initialForm?.schema || []);
    const [schemaTitle, setSchemaTitle] = useState(initialForm?.title || "Yeni Form");
    const [description, setDescription] = useState(initialForm?.description || "");
    const [linkedFormId, setLinkedFormId] = useState(initialForm?.linkedFormId || "");
    const [allowMultipleResponses, setAllowMultipleResponses] = useState(initialForm?.allowMultipleResponses || false);
    const [allowAnonymousResponses, setAllowAnonymousResponses] = useState(initialForm?.allowAnonymousResponses || false);
    const [editors, setEditors] = useState(initialForm?.collaborators || INITIAL_EDITORS);
    const [status, setStatus] = useState(initialForm?.status || 1);
    const currentUserRole = Number(initialForm?.userRole ?? 3);
    const isNewForm = !initialForm?.id;

    const isChildForm = initialForm?.isChildForm || false;

    const [dragSource, setDragSource] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [libraryTab, setLibraryTab] = useState("components");
    const [newEditor, setNewEditor] = useState("");
    const [newEditorRole, setNewEditorRole] = useState(1);

    const [linkOverlay, setLinkOverlay] = useState({ open: false, scenario: null, previousId: initialForm?.linkedFormId || "", nextId: "", reason: null });
    const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);

    const { mutate: saveForm, isPending, error, isSuccess, isError, reset } = useFormMutation();
    const { mutate: deleteForm, isPending: isDeletePending } = useDeleteFormMutation();
    const { data: linkableForms, isLoading: isLinkableFormsLoading } = useLinkableFormsQuery(initialForm?.id || formId);

    useEffect(() => {
        if (!isError && !isSuccess) return;

        const timer = setTimeout(() => {
            reset();
        }, 2000);

        return () => clearTimeout(timer);
    }, [isError, isSuccess, reset]);

    const handleRequestLinkForm = (nextLinkedFormId, reason = "manual") => {
        const nextId = nextLinkedFormId || "";
        const currentId = linkedFormId || "";

        let scenario = null;

        if (!currentId && nextId) {
            scenario = "link-add";
        } else if (currentId && nextId && nextId !== currentId) {
            scenario = "link-change";
        } else if (currentId && !nextId) {
            scenario = "link-remove";
        } else {
            return;
        }

        setLinkOverlay({ open: true, scenario, previousId: currentId, nextId, reason });
    };

    const applyFormState = (form) => {
        const nextForm = form ?? {};
        setSchema(Array.isArray(nextForm.schema) ? nextForm.schema : []);
        setSchemaTitle(nextForm.title || "Yeni Form");
        setDescription(nextForm.description || "");
        setLinkedFormId(nextForm.linkedFormId || "");
        setAllowMultipleResponses(Boolean(nextForm.allowMultipleResponses));
        setAllowAnonymousResponses(Boolean(nextForm.allowAnonymousResponses));
        setEditors(Array.isArray(nextForm.collaborators) && nextForm.collaborators.length > 0 ? nextForm.collaborators : INITIAL_EDITORS);
        setStatus(Number.isFinite(nextForm.status) ? nextForm.status : 1);
        setNewEditor("");
        setNewEditorRole(1);
    };

    const handleRefresh = async () => {
        if (isNewForm) {
            applyFormState(null);
            return;
        }
        if (!onRefresh) return;
        try {
            const result = await onRefresh();
            const refreshedForm = result?.data?.data ?? result?.data;
            if (refreshedForm) {
                applyFormState(refreshedForm);
            }
        } catch {
        }
    };

    const handleDeleteRequest = () => {
        if (isNewForm) return;
        setDeleteOverlayOpen(true);
    };

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
            Collaborators: editors.filter((editor) => Number(editor.role) !== 3).map((editor) => ({
                Email: editor.email,
                Role: editor.role
            }))
        };
        saveForm(payload, {
            onSuccess: (data) => {
                if (!isNewForm) return;
                const nextId = data?.id ?? data?.data?.id;
                if (nextId) {
                    router.push(`/admin/forms/${nextId}`);
                }
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!initialForm?.id || isDeletePending) return;
        deleteForm(initialForm.id, {
            onSuccess: () => {
                setDeleteOverlayOpen(false);
                router.push("/admin/forms");
            },
            onError: () => {
                setDeleteOverlayOpen(false);
            },
        });
    };

    const handleAddEditor = (event) => {
        event.preventDefault();
        const rawValue = newEditor.trim();
        if (!rawValue) return;
        const normalized = rawValue.includes("@") ? rawValue.split("@")[0] : rawValue;
        const formattedName = normalized.replace(/[\s._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
        const fallbackEmail = rawValue.includes("@") ? rawValue : `${rawValue.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@paylasim.local`;
        const userId = Math.random().toString(36).slice(2, 10);
        const nextRole = currentUserRole === 2 ? 1 : (Number(newEditorRole) === 2 ? 2 : 1);
        setEditors((prev) => [...prev, { userId, fullName: formattedName || fallbackEmail, email: fallbackEmail, role: nextRole, photoUrl: null }]);
        setNewEditor("");
    };

    const handleRemoveEditor = (editor) => {
        const editorRoleValue = Number(editor.role);
        if (editorRoleValue === 3) return;
        if (currentUserRole === 2) {
            if (editorRoleValue === 2) return;
        } else if (currentUserRole !== 3) {
            return;
        }
        setEditors((prev) => prev.filter((item) => item.userId !== editor.userId));
    };

    const handleChangeEditorRole = (editorId, nextRole) => {
        if (currentUserRole !== 3) return;
        setEditors((prev) => prev.map((item) => item.userId === editorId ? { ...item, role: nextRole } : item));
    };

    const resetLinkOverlay = () => {
        setLinkOverlay({
            open: false,
            scenario: null,
            previousId: "",
            nextId: "",
            reason: null,
        });
    };


    const patchField = (id, nextProps) => {
        setSchema((prev) => prev.map((field) => (field.id === id ? { ...field, props: nextProps } : field)));
    };

    if (typeof window !== "undefined") {
        window.getFormSchema = () => structuredClone(schema);
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            keyboardCodes: { start: ["Enter"], cancel: ["Escape"], end: ["Enter"] }
        })
    );

    return (
        <DndContext
            collisionDetection={pointerWithin}
            sensors={sensors}
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

                <LibraryPanel
                    activeTab={libraryTab}
                    onSelectTab={setLibraryTab}
                    handleSave={handleSave}
                    onRefresh={handleRefresh}
                    onDelete={handleDeleteRequest}
                    isDeleteDisabled={isNewForm || isDeletePending || currentUserRole !== 3}
                    isPending={isPending}
                    isSuccess={isSuccess}
                    isError={isError}
                >
                    {libraryTab === "components" ? (
                        <div className="grid grid-cols-1 gap-2 p-2 space-y-1">
                            {COMPONENTS.map((component) => (
                                <LibraryItem key={component.type} item={component} />
                            ))}
                        </div>
                    ) : libraryTab === "settings" ? (
                        <div className="relative h-full">
                            <div className={isChildForm ? "pointer-events-none opacity-40" : ""}>
                                <LibrarySettings
                                    editors={editors}
                                    onChangeEditorRole={handleChangeEditorRole}
                                    handleAddEditor={handleAddEditor}
                                    handleRemoveEditor={handleRemoveEditor}
                                    newEditor={newEditor}
                                    setNewEditor={setNewEditor}
                                    newEditorRole={newEditorRole}
                                    setNewEditorRole={setNewEditorRole}
                                    setLinkedFormId={handleRequestLinkForm}
                                    linkedFormId={linkedFormId}
                                    status={status}
                                    allowAnonymousResponses={allowAnonymousResponses}
                                    setAllowAnonymousResponses={setAllowAnonymousResponses}
                                    setStatus={setStatus}
                                    allowMultipleResponses={allowMultipleResponses}
                                    setAllowMultipleResponses={setAllowMultipleResponses}
                                    linkableForms={linkableForms ?? []}
                                    currentUserRole={currentUserRole}
                                />
                            </div>

                            <div className={`pointer-events-auto inset-0 flex items-center justify-center ${isChildForm ? "absolute" : "hidden"}`}>
                                <div className="mx-4 max-w-xs rounded-lg border border-neutral-700 bg-neutral-900/90 px-4 py-3 text-center shadow-lg">
                                    <p className="mb-1 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                                        Ayarlar kilitli
                                    </p>
                                    <p className="text-[11px] leading-relaxed text-neutral-300">
                                        Bu formun ayarları, bağlı olduğu ana form tarafından yönetilmektedir.
                                    </p>
                                </div>
                            </div>
                        </div>
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

            <ApprovalOverlay open={linkOverlay.open} preset={linkOverlay.scenario || "default"}
                onApprove={() => {
                    if (!linkOverlay.scenario) {
                        resetLinkOverlay();
                        return;
                    }
                    if (linkOverlay.scenario === "link-add" || linkOverlay.scenario === "link-change") {
                        setLinkedFormId(linkOverlay.nextId);
                    } else if (linkOverlay.scenario === "link-remove") {
                        setLinkedFormId("");
                    }
                    resetLinkOverlay();
                }}
                onReject={() => { if (linkOverlay.reason === "anonymous-toggle") setAllowAnonymousResponses(false); resetLinkOverlay(); }}
            />
            <ApprovalOverlay
                open={deleteOverlayOpen}
                preset="delete-form"
                context={{ isPending: isDeletePending }}
                onApprove={handleDeleteConfirm}
                onReject={() => setDeleteOverlayOpen(false)}
            />
        </DndContext>
    );
}
