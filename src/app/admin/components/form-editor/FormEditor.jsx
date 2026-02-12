"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { MousePointerClick, PackagePlus } from "lucide-react";
import { useSession } from "next-auth/react";

import { useFormContext } from "../../providers";
import { FormEditorProvider, useFormEditor } from "./FormEditorContext";
import { useFormDnD } from "./hooks/useFormDnD";
import { GhostComponent, Canvas, CanvasItem, DropSlot } from "./components/FormEditorComponents";
import { Library } from "./components/Library";
import { LibraryTrigger } from "./components/LibraryTrigger";
import { useDeleteFormMutation, useFormMutation, useLinkableFormsQuery } from "@/lib/hooks/useFormAdmin";
import { useShareLink } from "@/app/admin/hooks/useShareLink";
import ApprovalOverlay from "../ApprovalOverlay";
import { Drawer, DrawerContent } from "../utils/Drawer";

import { REGISTRY } from "../../../components/form-registry";

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

function FormEditorContent({ onRefresh, isNewForm }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { setTitle: setGlobalTitle, setStatus: setGlobalStatus } = useFormContext();
    const { state, dispatch } = useFormEditor();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [linkOverlay, setLinkOverlay] = useState({ open: false, scenario: null, previousId: "", nextId: "", reason: null });
    const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);

    const editorRef = useRef(null);
    const libraryDropElRef = useRef(null);
    const isLgUp = useMediaQuery("(min-width: 1024px)");

    const { mutate: saveForm, isPending, isSuccess, isError, reset } = useFormMutation();
    const { mutate: deleteForm, isPending: isDeletePending } = useDeleteFormMutation();
    const { shareStatus, handleShare } = useShareLink(state.id);

    useEffect(() => {
        setGlobalTitle(state.title);
        setGlobalStatus(state.status);
    }, [state.title, state.status, setGlobalTitle, setGlobalStatus]);

    useEffect(() => {
        if (isNewForm && state.editors.length === 0 && session?.user) {
            dispatch({
                type: "SET_EDITORS",
                payload: [{
                    user: {
                        id: session.user.id,
                        fullName: session.user.fullName,
                        email: session.user.email,
                        profilePictureUrl: session.user.profilePictureUrl
                    },
                    role: 3
                }]
            });
        }
    }, [session, isNewForm, state.editors.length, dispatch]);

    useEffect(() => {
        if (!isError && !isSuccess) return;
        const timer = setTimeout(() => reset(), 2000);
        return () => clearTimeout(timer);
    }, [isError, isSuccess, reset]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.getFormSchema = () => structuredClone(state.schema);
        }
    }, [state.schema]);

    const setSchemaBridge = useCallback((newSchemaOrUpdater) => {
        if (typeof newSchemaOrUpdater === 'function') {
            dispatch({ type: "SET_SCHEMA", payload: newSchemaOrUpdater(state.schema) });
        } else {
            dispatch({ type: "SET_SCHEMA", payload: newSchemaOrUpdater });
        }
    }, [state.schema, dispatch]);

    const { dragSource, activeDragItem, handlers } = useFormDnD(state.schema, setSchemaBridge, libraryDropElRef);

    const handleSave = () => {
        const payload = {
            Id: state.id || null,
            Title: state.title,
            Description: state.description,
            Schema: state.schema,
            Status: state.status,
            AllowMultipleResponses: state.allowAnonymousResponses ? true : state.allowMultipleResponses,
            AllowAnonymousResponses: state.allowAnonymousResponses,
            LinkedFormId: state.allowAnonymousResponses ? null : (state.linkedFormId || null),
            Collaborators: state.editors.map((editor) => ({
                UserId: editor.user.id,
                Role: Number(editor.role)
            }))
        };

        saveForm({
            id: state.id,
            payload: payload,
            isUpdate: !isNewForm
        }, {
            onSuccess: (data) => {
                if (!isNewForm) return;
                const nextId = data?.data?.id ?? data?.id;
                if (nextId) router.push(`/admin/forms/${nextId}/edit`);
            },
        });
    };

    const handleRefresh = async () => {
        if (isNewForm) {
            dispatch({ type: "RESET_FORM" });
            return;
        }
        if (!onRefresh) return;
        try {
            const result = await onRefresh();
            const refreshedForm = result?.data?.data ?? result?.data;
            if (refreshedForm) {
                dispatch({ type: "LOAD_FORM", payload: refreshedForm });
            }
        } catch (e) { console.error(e); }
    };

    const updateField = (id, updates) => {
        const nextSchema = state.schema.map((field) => (field.id === id ? { ...field, ...updates } : field));
        dispatch({ type: "SET_SCHEMA", payload: nextSchema });
    };

    const handleLibrarySelect = (item) => {
        const type = item?.type;
        if (!type) return;
        const id = Math.random().toString(36).slice(2, 10);
        const props = structuredClone(REGISTRY[type]?.defaults ?? {});
        dispatch({ type: "SET_SCHEMA", payload: [...state.schema, { id, type, props }] });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { setNodeRef: setLibraryDropNodeRef, isOver: isLibraryDropOver } = useDroppable({
        id: "library",
        disabled: isLgUp || drawerOpen,
    });

    const setLibraryDropRef = useCallback((node) => {
        libraryDropElRef.current = node;
        setLibraryDropNodeRef(node);
    }, [setLibraryDropNodeRef]);

    const gridContent = (
        <div className="grid grid-cols-12 gap-4">
            <Canvas
                dragSource={dragSource}
                schemaTitle={state.title}
                setSchemaTitle={(val) => dispatch({ type: "SET_TITLE", payload: val })}
                span={isLgUp ? 8 : 11}
            >
                {state.schema.length === 0 ? (
                    <div className="grid h-[80vh] place-items-center">
                        <div className="flex flex-col items-center gap-5 text-center px-6">
                            <div className="relative grid h-20 w-20 place-items-center rounded-3xl border-2 border-dashed border-neutral-800 bg-neutral-900/50 text-neutral-500">
                                {isLgUp ? <MousePointerClick size={32} strokeWidth={1.5} className="opacity-80" /> : <PackagePlus size={32} strokeWidth={1.5} className="opacity-80" />}
                            </div>
                            <div className="space-y-1.5 max-w-xs mx-auto">
                                <h3 className="text-lg font-semibold text-neutral-200">Formunuzu oluşturmaya başlayın</h3>
                                <p className="text-xs leading-relaxed text-neutral-500">
                                    {isLgUp ? "Sağ taraftaki kütüphaneden dilediğiniz bileşeni sürükleyip buraya bırakın." : "Bileşen panelini açın."}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <SortableContext items={state.schema.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                        <ul className="flex flex-col gap-2 max-w-2xl mx-auto mb-4">
                            <DropSlot index={0} enabled={dragSource === "library"} />
                            {state.schema.map((field, index) => (
                                <li key={field.id} className="flex flex-col">
                                    <CanvasItem field={field} index={index + 1} onUpdate={updateField} schema={state.schema} />
                                    <DropSlot index={index + 1} enabled={dragSource === "library"} />
                                </li>
                            ))}
                        </ul>
                    </SortableContext>
                )}
            </Canvas>

            {!isLgUp && <LibraryTrigger ref={setLibraryDropRef} dragSource={dragSource} isDropOver={isLibraryDropOver} isLgUp={isLgUp} />}

            {isLgUp && (
                <Library layout="grid"
                    onSave={handleSave}
                    onRefresh={handleRefresh}
                    onShare={handleShare}
                    onDelete={!isNewForm ? () => setDeleteOverlayOpen(true) : undefined}
                    isPending={isPending}
                    isSuccess={isSuccess}
                    isError={isError}
                    shareStatus={shareStatus}
                    isDeleteDisabled={isNewForm || isDeletePending || Number(state.userRole) !== 3}
                    onLibrarySelect={handleLibrarySelect}
                />
            )}
        </div>
    );

    return (
        <DndContext collisionDetection={pointerWithin} sensors={sensors} {...handlers}>
            <div ref={editorRef} className="relative">
                {!isLgUp ? (
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <div className="flex-1 h-full w-full p-4">{gridContent}</div>
                        <DrawerContent className="h-full">
                            <Library layout="drawer"
                                onSave={handleSave}
                                onRefresh={handleRefresh}
                                onShare={handleShare}
                                onDelete={!isNewForm ? () => setDeleteOverlayOpen(true) : undefined}
                                isPending={isPending}
                                isSuccess={isSuccess}
                                isError={isError}
                                shareStatus={shareStatus}
                                isDeleteDisabled={isNewForm || isDeletePending || Number(state.userRole) !== 3}
                                onLibrarySelect={handleLibrarySelect}
                            />
                        </DrawerContent>
                    </Drawer>
                ) : (
                    <div className="flex-1 h-full w-full p-4">{gridContent}</div>
                )}

                <DragOverlay>
                    {activeDragItem ? <GhostComponent active={activeDragItem} schema={state.schema} /> : null}
                </DragOverlay>

                <ApprovalOverlay open={linkOverlay.open} preset={linkOverlay.scenario || "default"}
                    onApprove={() => {
                        if (linkOverlay.scenario?.includes("link")) {
                            dispatch({ type: "UPDATE_SETTINGS", payload: { key: "linkedFormId", value: linkOverlay.scenario === "link-remove" ? "" : linkOverlay.nextId } });
                        }
                        setLinkOverlay({ open: false, scenario: null, previousId: "", nextId: "", reason: null });
                    }}
                    onReject={() => {
                        if (linkOverlay.reason === "anonymous-toggle") dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowAnonymousResponses", value: false } });
                        setLinkOverlay({ open: false, scenario: null, previousId: "", nextId: "", reason: null });
                    }}
                />
                <ApprovalOverlay open={deleteOverlayOpen} preset="delete-form" context={{ isPending: isDeletePending }}
                    onApprove={() => deleteForm(state.id, { onSuccess: () => router.push("/admin/forms"), onError: () => setDeleteOverlayOpen(false) })}
                    onReject={() => setDeleteOverlayOpen(false)}
                />
            </div>
        </DndContext>
    );
}

export default function FormEditor({ initialForm = null, onRefresh }) {
    const normalizedInitialData = initialForm ? {
        id: initialForm.id,
        schema: initialForm.schema || [],
        title: initialForm.title || "Yeni Form",
        description: initialForm.description || "",
        linkedFormId: initialForm.linkedFormId || "",
        allowMultipleResponses: initialForm.allowMultipleResponses || false,
        allowAnonymousResponses: initialForm.allowAnonymousResponses || false,
        editors: initialForm.collaborators || [],
        status: initialForm.status || 1,
        isChildForm: initialForm.isChildForm || false,
        userRole: initialForm.userRole || 3
    } : null;

    return (
        <FormEditorProvider initialData={normalizedInitialData}>
            <FormEditorContent onRefresh={onRefresh} isNewForm={!initialForm?.id} />
        </FormEditorProvider>
    );
}