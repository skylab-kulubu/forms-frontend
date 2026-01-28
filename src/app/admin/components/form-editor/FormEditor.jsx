"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { MousePointerClick, PackagePlus } from "lucide-react";
import { useSession } from "next-auth/react";

import { useFormDnD } from "./hooks/useFormDnD";
import { GhostComponent, Canvas, CanvasItem, DropSlot } from "./components/FormEditorComponents";
import { Library } from "./components/Library";
import { LibraryTrigger } from "./components/LibraryTrigger";
import { useDeleteFormMutation, useFormMutation, useLinkableFormsQuery } from "@/lib/hooks/useFormAdmin";
import { useShareLink } from "@/app/admin/hooks/useShareLink";
import ApprovalOverlay from "../ApprovalOverlay";
import { Drawer, DrawerContent } from "../utils/Drawer";

import { REGISTRY } from "../../../components/form-registry";

const formId = crypto.randomUUID();

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
    const [editors, setEditors] = useState(initialForm?.collaborators || []);
    const [status, setStatus] = useState(initialForm?.status || 1);
    const currentUserRole = Number(initialForm?.userRole ?? 3);
    const isNewForm = !initialForm?.id;

    const [newEditor, setNewEditor] = useState("");
    const [newEditorRole, setNewEditorRole] = useState(1);
    const editorRef = useRef(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const libraryDropElRef = useRef(null);

    const isLgUp = useMediaQuery("(min-width: 1024px)");

    const [linkOverlay, setLinkOverlay] = useState({ open: false, scenario: null, previousId: initialForm?.linkedFormId || "", nextId: "", reason: null });
    const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);

    const { dragSource, activeDragItem, handlers } = useFormDnD(schema, setSchema, libraryDropElRef);
    const { data: session } = useSession();

    useEffect(() => {
        if (isNewForm && editors.length === 0 && session?.user) {
            setEditors([{
                user: {
                    id: session.user.id,
                    fullName: session.user.fullName,
                    email: session.user.email,
                    profilePictureUrl: session.user.profilePictureUrl
                },
                role: 3
            }]);
        }
    }, [session, isNewForm, editors.length]);

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
        if (Array.isArray(nextForm.collaborators) && nextForm.collaborators.length > 0) { setEditors(nextForm.collaborators);
        } else if (session?.user) {
            setEditors([{
                user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email, profilePictureUrl: session.user.profilePictureUrl },
                role: 3
            }]);
        } else { setEditors([]);}
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

    const { shareStatus, handleShare } = useShareLink(initialForm?.id);

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

    const handleAddEditor = (selectedUser) => {
        if (editors.find((e) => e.user.id === selectedUser.id)) return;
        const role = 1;

        const newCollaborator = {
            user: {
                id: selectedUser.id,
                fullName: selectedUser.firstName,
                email: selectedUser.email,
                profilePictureUrl: selectedUser.profilePictureUrl || null,
            },
            role: role
        };

        setEditors((prev) => [...prev, newCollaborator]);
    };

    const handleRemoveEditor = (editor) => {
        const editorRoleValue = Number(editor.role);
        if (editorRoleValue === 3) return;
        if (currentUserRole === 2) {
            if (editorRoleValue === 2) return;
        } else if (currentUserRole !== 3) {
            return;
        }
        setEditors((prev) => prev.filter((item) => item.user?.id !== editor.user?.id));
    };

    const handleChangeEditorRole = (editorId, nextRole) => {
        if (currentUserRole !== 3) return;
        setEditors((prev) => prev.map((item) => item.user?.id === editorId ? { ...item, role: nextRole } : item));
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
        <DndContext collisionDetection={pointerWithin} sensors={sensors} {...handlers}>
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
