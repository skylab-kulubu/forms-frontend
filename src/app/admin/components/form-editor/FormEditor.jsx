"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { MousePointerClick, PackagePlus } from "lucide-react";
import { useSession } from "next-auth/react";

import { useFormContext } from "../../providers";
import { FormEditorProvider, useFormEditor } from "./FormEditorContext";
import { useFormDnD } from "./hooks/useFormDnD";
import { GhostComponent, Canvas, CanvasItem, DropSlot, InsertSlot } from "./components/FormEditorComponents";
import { genFieldId } from "./fieldId";
import { Library } from "./components/Library";
import { LibraryTrigger } from "./components/LibraryTrigger";
import { EditorHeaderActions, EventReturnBar, HeaderStatusPill } from "./components/EditorHeaderActions";
import { useDeleteFormMutation, useFormMutation } from "@/lib/hooks/useFormAdmin";
import { useDraftAutoSave } from "./hooks/useDraftAutoSave";
import { useDeleteDraftMutation } from "@/lib/hooks/useDraft";
import { request } from "@/lib/apiClient";
import {
    FORM_STATUS_OPEN,
    clearNewFormDraft,
    cloneSchema,
    pickTemplateGroup,
    readNewFormDraft,
    writeNewFormDraft,
    ensureEventIdentityFields,
    isIdentityField,
    identityKeyOf,
} from "@/lib/event-handoff";
import ApprovalOverlay from "../ApprovalOverlay";
import ShareOverlay from "../ShareOverlay";
import { Drawer, DrawerContent } from "../utils/Drawer";
import { FormPreview } from "./components/FormPreview";
import {
    captureReturnTo,
    editPathWithReturnTo,
    eventRefFromForm,
    readStoredReturnTo,
    returnToEventHref,
    sanitizeReturnTo,
} from "@/lib/return-to";

import { REGISTRY } from "../../../components/form-registry";
import { migrateSchema } from "../../../components/form-migrate";

const emptySubscribe = () => () => {};

function useMediaQuery(query) {
    const subscribe = useCallback((onChange) => {
        const media = window.matchMedia(query);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [query]);

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

class SmartKeyboardSensor extends KeyboardSensor {
  static activators = [
    {
      eventName: "onKeyDown",
      handler: (event, options, extra) => {
        const target = event.nativeEvent.target;
        
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable;

        if (isInput) {
          return false;
        }

        return KeyboardSensor.activators[0].handler(event, options, extra);
      },
    },
  ];
}

function FormEditorContent({ isNewForm, draft, onRefresh, handoff, formEvent }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { setTitle: setGlobalTitle, setStatus: setGlobalStatus } = useFormContext();
    const { state, dispatch } = useFormEditor();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [shareOverlayOpen, setShareOverlayOpen] = useState(false);

    const editorRef = useRef(null);
    const libraryDropElRef = useRef(null);
    const isLgUp = useMediaQuery("(min-width: 1024px)");

    const [lastSavedAt, setLastSavedAt] = useState(null);
    const { mutate: saveForm, isPending, isSuccess, isError, error, reset } = useFormMutation();
    const { mutate: deleteForm, isPending: isDeletePending } = useDeleteFormMutation();

    const { cancel: cancelDraftAutoSave, syncStatus: draftSyncStatus, draftSavedAt } = useDraftAutoSave(isNewForm ? null : state.id, state);
    const [publishedFlash, setPublishedFlash] = useState(false);
    const { mutate: deleteDraft, isPending: isDiscardingDraft } = useDeleteDraftMutation();
    const [initialDraft] = useState(draft);
    const [hasDraft, setHasDraft] = useState(!!draft);
    const [draftNotice, setDraftNotice] = useState(!!draft);

    const rawReturnTo = useSyncExternalStore(
        emptySubscribe,
        () => new URLSearchParams(window.location.search).get("returnTo"),
        () => null,
    );
    const returnTo = sanitizeReturnTo(rawReturnTo);
    const hasReturnTo = Boolean(returnTo) || Boolean(handoff?.eventId);
    const returnHref = state.id && returnTo ? returnToEventHref(returnTo, state.id) : null;
    const eventRef = eventRefFromForm(
        {
            event: formEvent || { id: handoff?.eventId, name: handoff?.title },
            eventId: formEvent?.id || handoff?.eventId,
            eventName: formEvent?.name || handoff?.title,
        },
        returnTo,
    );

    useEffect(() => {
        captureReturnTo(rawReturnTo, typeof sessionStorage === "undefined" ? null : sessionStorage);
    }, [rawReturnTo]);

    const eventLinked = Boolean(handoff?.eventLinked || handoff?.eventId || eventRef?.id);

    useEffect(() => {
        if (!eventLinked) return;
        const next = ensureEventIdentityFields(state.schema);
        if (JSON.stringify(next) !== JSON.stringify(state.schema)) {
            dispatch({ type: "SET_SCHEMA", payload: next });
        }
        if (!state.allowAnonymousResponses) {
            dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowAnonymousResponses", value: true } });
        }
    }, [eventLinked, state.schema, state.allowAnonymousResponses, dispatch]);

    useEffect(() => {
        if (!initialDraft) return;
        dispatch({ type: "LOAD_DRAFT", payload: initialDraft });
        const timer = setTimeout(() => setDraftNotice(false), 4000);
        return () => clearTimeout(timer);
    }, [initialDraft, dispatch]);

    useEffect(() => {
        if (!isNewForm) return;
        let cancelled = false;
        const storage = typeof sessionStorage === "undefined" ? null : sessionStorage;
        const raw =
            typeof window === "undefined"
                ? null
                : new URLSearchParams(window.location.search).get("returnTo");
        const stored = readStoredReturnTo(storage) || captureReturnTo(raw, storage);

        (async () => {
            const local = readNewFormDraft(storage, stored);
            if (local?.schema?.length) {
                if (cancelled) return;
                dispatch({ type: "LOAD_DRAFT", payload: local });
                setDraftNotice(true);
                return;
            }
            if (handoff?.fromForm) {
                try {
                    const payload = await request(`/api/admin/forms/${handoff.fromForm}`);
                    const row = payload?.data ?? payload;
                    const schema = cloneSchema(row?.schema);
                    if (cancelled || !schema.length) return;
                    dispatch({
                        type: "LOAD_DRAFT",
                        payload: { schema, status: handoff.open ? FORM_STATUS_OPEN : row?.status },
                    });
                    setDraftNotice(true);
                    return;
                } catch {}
            }
            if (!handoff?.ownerTeam) return;
            try {
                const groupsPayload = await request("/api/admin/forms/component-groups?PageSize=50");
                const items = groupsPayload?.data?.items ?? [];
                const match = pickTemplateGroup(items, handoff.ownerTeam);
                if (cancelled || !match) return;
                dispatch({ type: "SET_SCHEMA", payload: cloneSchema(match.schema) });
                setDraftNotice(true);
            } catch {}
        })();

        return () => {
            cancelled = true;
        };
    }, [isNewForm, handoff?.fromForm, handoff?.ownerTeam, handoff?.open, dispatch]);

    useEffect(() => {
        if (!isNewForm) return;
        const storage = typeof sessionStorage === "undefined" ? null : sessionStorage;
        const raw =
            typeof window === "undefined"
                ? null
                : new URLSearchParams(window.location.search).get("returnTo");
        const stored = readStoredReturnTo(storage) || captureReturnTo(raw, storage);
        if (!stored || !state.schema.length) return;
        writeNewFormDraft(storage, stored, {
            title: state.title,
            description: state.description,
            schema: state.schema,
            status: state.status,
            allowAnonymousResponses: state.allowAnonymousResponses,
            allowMultipleResponses: state.allowMultipleResponses,
            requiresManualReview: state.requiresManualReview,
        });
    }, [
        isNewForm,
        state.title,
        state.description,
        state.schema,
        state.status,
        state.allowAnonymousResponses,
        state.allowMultipleResponses,
        state.requiresManualReview,
    ]);

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

    useEffect(() => {
        if (state.isSaved) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [state.isSaved]);

    useEffect(() => {
        if (!publishedFlash) return;
        const timer = setTimeout(() => setPublishedFlash(false), 2200);
        return () => clearTimeout(timer);
    }, [publishedFlash]);

    const setSchemaBridge = useCallback((newSchemaOrUpdater) => {
        const wrap = (schema) => (eventLinked ? ensureEventIdentityFields(schema) : schema);
        if (typeof newSchemaOrUpdater === 'function') {
            dispatch({ type: "SET_SCHEMA", payload: wrap(newSchemaOrUpdater(state.schema)) });
        } else {
            dispatch({ type: "SET_SCHEMA", payload: wrap(newSchemaOrUpdater) });
        }
    }, [state.schema, dispatch, eventLinked]);

    const workflow = state.workflow ?? null;
    const isWorkflowLocked = Boolean(workflow?.isPublished);
    const lockedById = useMemo(() => new Map(
        isWorkflowLocked
            ? (workflow.lockedQuestions ?? []).map((question) => [question.id, { values: Array.isArray(question.values) ? question.values : [] }])
            : []
    ), [workflow, isWorkflowLocked]);

    const { dragSource, activeDragItem, handlers } = useFormDnD(state.schema, setSchemaBridge, libraryDropElRef, (fieldId) => lockedById.has(fieldId));
    const isLockedDrag = dragSource === "canvas" && lockedById.has(activeDragItem?.data?.current?.id);

    const handleSave = () => {
        const payload = {
            Id: state.id || null,
            Title: state.title,
            Description: state.description,
            Schema: eventLinked ? ensureEventIdentityFields(state.schema) : state.schema,
            Status: state.status,
            AllowMultipleResponses: eventLinked || state.allowAnonymousResponses ? true : state.allowMultipleResponses,
            AllowAnonymousResponses: eventLinked ? true : state.allowAnonymousResponses,
            RequiresManualReview: state.requiresManualReview,
            Collaborators: state.editors.map((editor) => ({
                UserId: editor.user.id,
                Role: Number(editor.role)
            })),
            EventId: eventRef?.id || handoff?.eventId || null
        };

        saveForm({
            id: state.id,
            payload: payload,
            isUpdate: !isNewForm
        }, {
            onSuccess: (data) => {
                cancelDraftAutoSave();
                dispatch({ type: "MARK_SAVED" });
                setLastSavedAt(new Date());
                setPublishedFlash(true);
                const storage = typeof sessionStorage === "undefined" ? null : sessionStorage;
                const raw =
                    typeof window === "undefined"
                        ? null
                        : new URLSearchParams(window.location.search).get("returnTo");
                const stored = readStoredReturnTo(storage) || captureReturnTo(raw, storage);
                clearNewFormDraft(storage, stored);

                if (isNewForm) {
                    const nextId = data?.data?.id ?? data?.id;
                    if (nextId) {
                        router.push(editPathWithReturnTo(nextId, stored));
                    }
                    return;
                }

                if (state.id) {
                    deleteDraft(state.id, {
                        onSuccess: () => { setHasDraft(false); setDraftNotice(false); },
                    });
                }
            },
        });
    };

    const handleUndo = () => dispatch({ type: "UNDO" });
    const canUndo = state._history.length > 0;

    const handleDiscardDraft = () => {
        if (!state.id) return;
        deleteDraft(state.id, {
            onSuccess: async () => {
                setHasDraft(false);
                setDraftNotice(false);
                if (!onRefresh) return;
                try {
                    const result = await onRefresh();
                    const refreshedForm = result?.data?.data ?? result?.data;
                    if (refreshedForm) dispatch({ type: "LOAD_FORM", payload: refreshedForm });
                } catch (e) { console.error(e); }
            },
        });
    };

    const updateField = (id, updates) => {
        const nextSchema = state.schema.map((field) => {
            if (field.id !== id) return field;
            const next = { ...field, ...updates };
            const key = identityKeyOf(field) || identityKeyOf(next);
            if (!key) return next;
            return {
                ...next,
                props: {
                    ...(next.props ?? {}),
                    identity: key,
                    required: true,
                    inputType: key === "email" ? "email" : "name",
                },
            };
        });
        dispatch({ type: "SET_SCHEMA", payload: nextSchema });
    };

    const duplicateField = (id) => {
        const index = state.schema.findIndex((field) => field.id === id);
        if (index === -1) return;
        const source = state.schema[index];
        if (isIdentityField(source)) return;
        const copy = { ...source, id: genFieldId(), props: structuredClone(source.props ?? {}) };
        const next = [...state.schema];
        next.splice(index + 1, 0, copy);
        dispatch({ type: "SET_SCHEMA", payload: next });
    };

    const deleteField = (id) => {
        if (isIdentityField(state.schema.find((field) => field.id === id))) return;
        if (lockedById.has(id)) return;
        // Silinen alana bağlı koşullar da temizlenir (sürükle-sil ile aynı davranış).
        const next = state.schema.filter((field) => field.id !== id).map((field) => {
            if (field.condition?.fieldId !== id) return field;
            const { condition, ...rest } = field;
            return rest;
        });
        dispatch({ type: "SET_SCHEMA", payload: next });
    };

    const moveField = (id, direction) => {
        const index = state.schema.findIndex((field) => field.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= state.schema.length) return;
        dispatch({ type: "SET_SCHEMA", payload: arrayMove(state.schema, index, target) });
    };

    const insertFieldAt = (index, type) => {
        const props = structuredClone(REGISTRY[type]?.defaults ?? {});
        const next = [...state.schema];
        next.splice(index, 0, { id: genFieldId(), type, props });
        dispatch({ type: "SET_SCHEMA", payload: next });
    };

    const handleLibrarySelect = (item) => {
        const type = item?.type;
        if (!type) return;
        insertFieldAt(state.schema.length, type);
    };

    const handleGroupSelect = (group) => {
        const groupSchema = Array.isArray(group?.schema) ? group.schema : [];
        if (groupSchema.length === 0) return;
        const newFields = groupSchema.map((field) => ({
            ...field,
            id: genFieldId(),
            props: structuredClone(field.props ?? REGISTRY[field.type]?.defaults ?? {}),
        }));
        dispatch({ type: "SET_SCHEMA", payload: [...state.schema, ...newFields] });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(SmartKeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { setNodeRef: setLibraryDropNodeRef, isOver: isLibraryDropOver } = useDroppable({
        id: "library",
        disabled: isLgUp || drawerOpen,
    });

    const setLibraryDropRef = useCallback((node) => {
        libraryDropElRef.current = node;
        setLibraryDropNodeRef(node);
    }, [setLibraryDropNodeRef]);

    const saveStatusChip = (
        <HeaderStatusPill
            dirty={!state.isSaved}
            draftSyncStatus={draftSyncStatus}
            draftSavedAt={draftSavedAt}
            isSaving={isPending}
            isFailed={isError}
            lastSavedAt={lastSavedAt}
            publishedFlash={publishedFlash}
        />
    );

    const gridContent = (
        <div className="grid grid-cols-12 gap-4">
            <Canvas dragSource={dragSource} schemaTitle={state.title}
                setSchemaTitle={(val) => dispatch({ type: "SET_TITLE", payload: val })}
                span={isLgUp ? 8 : 11}
            >
                {state.schema.length === 0 ? (
                    <div className="grid h-full place-items-center">
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
                            {dragSource === "library"
                                ? <DropSlot index={0} enabled />
                                : <InsertSlot index={0} onInsert={insertFieldAt} hidden={!!dragSource} />}
                            {state.schema.map((field, index) => (
                                <li key={field.id} className="flex flex-col">
                                    <CanvasItem field={field} index={index + 1} onUpdate={updateField} schema={state.schema}
                                        dragActive={!!dragSource}
                                        onDuplicate={duplicateField} onDelete={deleteField} onMove={moveField}
                                        canMoveUp={index > 0} canMoveDown={index < state.schema.length - 1}
                                        workflowLock={lockedById.get(field.id) ?? null}
                                    />
                                    {dragSource === "library"
                                        ? <DropSlot index={index + 1} enabled />
                                        : <InsertSlot index={index + 1} onInsert={insertFieldAt} hidden={!!dragSource} />}
                                </li>
                            ))}
                        </ul>
                    </SortableContext>
                )}
            </Canvas>

            {!isLgUp && <LibraryTrigger ref={setLibraryDropRef} dragSource={dragSource} isDropOver={isLibraryDropOver} isLgUp={isLgUp} isLockedDrag={isLockedDrag} />}

            {isLgUp && (
                <Library layout="grid" onLibrarySelect={handleLibrarySelect} onGroupSelect={handleGroupSelect} isLockedDrag={isLockedDrag} />
            )}
        </div>
    );

    return (
        <DndContext collisionDetection={pointerWithin} sensors={sensors} {...handlers}>
            <EditorHeaderActions
                saveStatus={saveStatusChip}
                returnHref={returnHref}
                onPreview={() => setPreviewOpen(true)}
                onShare={!isNewForm ? () => setShareOverlayOpen(true) : undefined}
                isShareDisabled={isNewForm}
                hasDraft={hasDraft}
                onDiscardDraft={handleDiscardDraft}
                isDiscardingDraft={isDiscardingDraft}
                onUndo={handleUndo}
                canUndo={canUndo}
                onDelete={!isNewForm ? () => setDeleteOverlayOpen(true) : undefined}
                isDeleteDisabled={isNewForm || isDeletePending || Number(state.userRole) !== 3 || isWorkflowLocked}
                deleteLabel={isWorkflowLocked ? "Yayındaki akışta kullanıldığı için silinemez" : "Formu sil"}
                onSave={handleSave}
                isPending={isPending}
                isError={isError}
                error={error}
                draftNotice={draftNotice}
                onDraftNoticeClose={() => setDraftNotice(false)}
            />
            <div ref={editorRef} className="relative">
                <EventReturnBar returnHref={returnHref} pending={hasReturnTo && !returnHref} eventHref={eventRef?.href} eventName={eventRef?.name} />
                {!isLgUp ? (
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <div className="flex-1 h-full w-full p-4">{gridContent}</div>
                        <DrawerContent className="h-full">
                            <Library layout="drawer" onLibrarySelect={handleLibrarySelect} onGroupSelect={handleGroupSelect} isLockedDrag={isLockedDrag} />
                        </DrawerContent>
                    </Drawer>
                ) : (
                    <div className="flex-1 h-full w-full p-4">{gridContent}</div>
                )}

                <DragOverlay>
                    {activeDragItem ? <GhostComponent active={activeDragItem} schema={state.schema} /> : null}
                </DragOverlay>

                <ApprovalOverlay open={deleteOverlayOpen} preset="delete-form" context={{ isPending: isDeletePending }}
                    onApprove={() => deleteForm(state.id, { onSuccess: () => router.push("/admin/forms"), onError: () => setDeleteOverlayOpen(false) })}
                    onReject={() => setDeleteOverlayOpen(false)}
                />

                <FormPreview open={previewOpen} onClose={() => setPreviewOpen(false)} />

                <ShareOverlay open={shareOverlayOpen} onClose={() => setShareOverlayOpen(false)}
                    resource="form" resourceId={state.id}
                    title="Formu Paylaş"
                    description="Bu bağlantıyla form herkese açık olarak doldurulabilir."
                />
            </div>
        </DndContext>
    );
}

export default function FormEditor({ initialForm = null, draft = null, onRefresh, handoff = null }) {
    const normalizedInitialData = initialForm ? {
        id: initialForm.id,
        schema: migrateSchema(initialForm.schema),
        title: initialForm.title || "Yeni Form",
        description: initialForm.description || "",
        allowMultipleResponses: initialForm.allowMultipleResponses || false,
        allowAnonymousResponses: initialForm.allowAnonymousResponses || false,
        requiresManualReview: initialForm.requiresManualReview || false,
        editors: initialForm.collaborators || [],
        status: initialForm.status || 1,
        userRole: initialForm.userRole || 3,
        workflow: initialForm.workflow ?? null
    } : handoff?.eventLinked ? {
        title: handoff.title || "Yeni Form",
        status: handoff.open ? FORM_STATUS_OPEN : 1,
        allowAnonymousResponses: true,
        allowMultipleResponses: true,
        schema: ensureEventIdentityFields([]),
    } : null;

    return (
        <FormEditorProvider initialData={normalizedInitialData}>
            <FormEditorContent isNewForm={!initialForm?.id} draft={draft} onRefresh={onRefresh} handoff={handoff} formEvent={initialForm?.event ?? null} />
        </FormEditorProvider>
    );
}