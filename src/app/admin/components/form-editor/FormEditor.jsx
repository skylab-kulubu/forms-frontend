"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { MousePointerClick, PackagePlus } from "lucide-react";

import { GhostComponent, Canvas, CanvasItem, DropSlot } from "./components/FormEditorComponents";
import { Library } from "./components/Library";
import { LibraryTrigger } from "./components/LibraryTrigger";
import { useDeleteFormMutation, useFormMutation, useLinkableFormsQuery } from "@/lib/hooks/useFormAdmin";
import ApprovalOverlay from "../ApprovalOverlay";
import { Drawer, DrawerContent } from "../utils/Drawer";

import { REGISTRY } from "../../../components/form-registry";

const FIXED_USER_ID = "11111111-1111-1111-1111-111111111111";
const formId = crypto.randomUUID();

const INITIAL_EDITORS = [{ user: { userId: FIXED_USER_ID, fullName: "--", email: "--", role: 3, profilePictureUrl: null }, role: 3 }];

function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const media = window.matchMedia(query);
        const handleChange = (event) => setMatches(event.matches);
        media.addEventListener("change", handleChange);
        setMatches(media.matches);
        return () => media.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
}

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

    const [dragSource, setDragSource] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [newEditor, setNewEditor] = useState("");
    const [newEditorRole, setNewEditorRole] = useState(1);
    const [shareStatus, setShareStatus] = useState("idle");
    const shareTimerRef = useRef(null);
    const editorRef = useRef(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const lastOverRef = useRef(null);
    const libraryDropElRef = useRef(null);

    const isLgUp = useMediaQuery("(min-width: 1024px)");

    const [linkOverlay, setLinkOverlay] = useState({ open: false, scenario: null, previousId: initialForm?.linkedFormId || "", nextId: "", reason: null });
    const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);

    const { mutate: saveForm, isPending, error, isSuccess, isError, reset } = useFormMutation();
    const { mutate: deleteForm, isPending: isDeletePending } = useDeleteFormMutation();
    const { data: linkableForms, isLoading: isLinkableFormsLoading } = useLinkableFormsQuery(initialForm?.id);

    useEffect(() => {
        if (!isError && !isSuccess) return;

        const timer = setTimeout(() => {
            reset();
        }, 2000);

        return () => clearTimeout(timer);
    }, [isError, isSuccess, reset]);

    useEffect(() => {
        return () => {
            if (shareTimerRef.current) {
                clearTimeout(shareTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isLgUp) {
            setDrawerOpen(false);
        }
    }, [isLgUp]);

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

    const handleShare = async () => {
        if (!initialForm?.id) return;
        const shareUrl = `https://forms.yildizskylab.com/${initialForm.id}`;
        let nextStatus = "error";

        if (navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                nextStatus = "success";
            } catch {
            }
        }

        if (shareTimerRef.current) {
            clearTimeout(shareTimerRef.current);
        }
        setShareStatus(nextStatus);
        shareTimerRef.current = setTimeout(() => {
            setShareStatus("idle");
            shareTimerRef.current = null;
        }, 2000);
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
            Collaborators: editors.map((editor) => ({
                UserId: editor.user.id,
                Role: Number(editor.role)
            }))
        };
        saveForm(payload, {
            onSuccess: (data) => {
                if (!isNewForm) return;
                const nextId = data?.id ?? data?.data?.id;
                if (nextId) {
                    router.push(`/admin/forms/${nextId}/edit`);
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

        const newCollaborator = {
            user: { id: userId, fullName: formattedName, email: fallbackEmail, photoUrl: null },
            role: nextRole
        };

        setEditors((prev) => [...prev, newCollaborator]);
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
        setLinkOverlay({ open: false, scenario: null, previousId: "", nextId: "", reason: null });
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

    const { setNodeRef: setLibraryDropNodeRef, isOver: isLibraryDropOver } = useDroppable({
        id: "library",
        disabled: isLgUp || drawerOpen,
    });

    const setLibraryDropRef = useCallback((node) => {
        libraryDropElRef.current = node;
        setLibraryDropNodeRef(node);
    }, [setLibraryDropNodeRef]);

    const handleLibrarySelect = (item) => {
        const type = item?.type;
        if (!type) return;
        const id = Math.random().toString(36).slice(2, 10);
        const props = structuredClone(REGISTRY[type]?.defaults ?? {});
        setSchema((prev) => [...prev, { id, type, props }]);
    };

    const formState = {
        schema, description, editors, status, linkedFormId, allowAnonymousResponses,
        allowMultipleResponses, newEditor, newEditorRole, linkableForms: linkableForms ?? [], isChildForm: initialForm?.isChildForm
    };

    const formActions = {
        setDescription, handleSave, onRefresh: handleRefresh, onShare: handleShare, handleDeleteRequest, handleAddEditor,
        handleRemoveEditor, handleChangeEditorRole, setNewEditor, setNewEditorRole, setLinkedFormId: handleRequestLinkForm,
        setStatus, setAllowAnonymousResponses, setAllowMultipleResponses
    };

    const gridContent = (
        <div className="grid grid-cols-12 gap-4">
            <Canvas dragSource={dragSource} schemaTitle={schemaTitle} setSchemaTitle={setSchemaTitle} span={isLgUp ? 8 : 11}>
                {schema.length === 0 ? (
                    <div className="grid h-[80vh] place-items-center">
                        <div className="flex flex-col items-center gap-5 text-center px-6">
                            <div className="relative grid h-20 w-20 place-items-center rounded-3xl border-2 border-dashed border-neutral-800 bg-neutral-900/50 text-neutral-500">
                                {isLgUp ? (
                                    <MousePointerClick size={32} strokeWidth={1.5} className="opacity-80" />
                                ) : (
                                    <PackagePlus size={32} strokeWidth={1.5} className="opacity-80" />
                                )}
                            </div>

                            <div className="space-y-1.5 max-w-xs mx-auto">
                                <h3 className="text-lg font-semibold text-neutral-200">
                                    Formunuzu oluşturmaya başlayın
                                </h3>
                                <p className="text-xs leading-relaxed text-neutral-500">
                                    {isLgUp ? "Sağ taraftaki kütüphaneden dilediğiniz bileşeni sürükleyip buraya bırakın." : "Formunuza yeni alanlar eklemek için bileşen panelini açın."}
                                </p>
                            </div>
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

            {!isLgUp && (
                <LibraryTrigger ref={setLibraryDropRef} dragSource={dragSource} isDropOver={isLibraryDropOver} isLgUp={isLgUp} />
            )}

            {isLgUp && (
                <Library layout="grid" formState={formState} formActions={formActions} isPending={isPending}
                    isSuccess={isSuccess} isError={isError} shareStatus={shareStatus} currentUserRole={currentUserRole}
                    isDeleteDisabled={isNewForm || isDeletePending || currentUserRole !== 3}
                />
            )}
        </div>
    );

    return (
        <DndContext collisionDetection={pointerWithin} sensors={sensors}
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
                const overId = over?.id ?? lastOverRef.current;
                let isOverLibrary = overId === "library";

                if (!isOverLibrary && from === "canvas" && libraryDropElRef.current) {
                    const targetRect = libraryDropElRef.current.getBoundingClientRect();
                    const activeRect = active.rect?.current?.translated ?? active.rect?.current;
                    if (activeRect) {
                        const intersects = activeRect.left < targetRect.right
                            && activeRect.right > targetRect.left
                            && activeRect.top < targetRect.bottom
                            && activeRect.bottom > targetRect.top;
                        if (intersects) {
                            isOverLibrary = true;
                        }
                    }
                }

                if (from === "canvas" && isOverLibrary) {
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
                lastOverRef.current = null;
            }}
            onDragOver={({ over }) => {
                lastOverRef.current = over?.id ?? null;
            }}
            onDragCancel={() => {
                setDragSource(null);
                setActiveDragItem(null);
                lastOverRef.current = null;
            }}
        >
            <div ref={editorRef} className="relative">
                {!isLgUp ? (
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <div className="flex-1 h-full w-full p-4">
                            {gridContent}
                        </div>

                        <DrawerContent className="h-full">
                            <div className="h-full flex flex-col">
                                <div className="flex-1 min-h-0 px-1 py-1">
                                    <Library layout="drawer" formState={formState} formActions={formActions} onLibrarySelect={handleLibrarySelect}
                                        isPending={isPending} isSuccess={isSuccess} isError={isError} shareStatus={shareStatus}
                                        currentUserRole={currentUserRole} isDeleteDisabled={isNewForm || isDeletePending || currentUserRole !== 3}
                                    />
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>
                ) : (
                    <div className="flex-1 h-full w-full p-4">
                        {gridContent}
                    </div>
                )}

                <DragOverlay>
                    {activeDragItem ? <GhostComponent active={activeDragItem} schema={schema} /> : null}
                </DragOverlay>

                <ApprovalOverlay open={linkOverlay.open} preset={linkOverlay.scenario || "default"}
                    onApprove={() => {
                        if (!linkOverlay.scenario) { resetLinkOverlay(); return; }
                        if (linkOverlay.scenario === "link-add" || linkOverlay.scenario === "link-change") { setLinkedFormId(linkOverlay.nextId); }
                        else if (linkOverlay.scenario === "link-remove") { setLinkedFormId(""); }
                        resetLinkOverlay();
                    }}
                    onReject={() => { if (linkOverlay.reason === "anonymous-toggle") setAllowAnonymousResponses(false); resetLinkOverlay(); }}
                />
                <ApprovalOverlay open={deleteOverlayOpen} preset="delete-form"
                    context={{ isPending: isDeletePending }}
                    onApprove={handleDeleteConfirm}
                    onReject={() => setDeleteOverlayOpen(false)}
                />
            </div>
        </DndContext>
    );
}