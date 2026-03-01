"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { MousePointerClick, PackagePlus } from "lucide-react";

import { GroupEditorProvider, useGroupEditor } from "./GroupEditorContext";
import { useFormDnD } from "../form-editor/hooks/useFormDnD";
import { GhostComponent, Canvas, CanvasItem, DropSlot } from "../form-editor/components/FormEditorComponents";
import { LibraryTrigger } from "../form-editor/components/LibraryTrigger";
import { GroupLibrary } from "./GroupLibrary";
import { useGroupMutation, useDeleteGroupMutation } from "@/lib/hooks/useGroupAdmin";
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

class SmartKeyboardSensor extends KeyboardSensor {
    static activators = [
        {
            eventName: "onKeyDown",
            handler: (event, options, extra) => {
                const target = event.nativeEvent.target;
                const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
                if (isInput) return false;
                return KeyboardSensor.activators[0].handler(event, options, extra);
            },
        },
    ];
}

function GroupEditorContent({ onRefresh, isNewGroup }) {
    const router = useRouter();
    const { state, dispatch } = useGroupEditor();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [deleteOverlayOpen, setDeleteOverlayOpen] = useState(false);

    const editorRef = useRef(null);
    const libraryDropElRef = useRef(null);
    const isLgUp = useMediaQuery("(min-width: 1024px)");

    const { mutate: saveGroup, isPending, isSuccess, isError, error, reset } = useGroupMutation();
    const { mutate: deleteGroup, isPending: isDeletePending } = useDeleteGroupMutation();

    useEffect(() => {
        if (!isError && !isSuccess) return;
        const timer = setTimeout(() => reset(), 2000);
        return () => clearTimeout(timer);
    }, [isError, isSuccess, reset]);

    const setSchemaBridge = useCallback((newSchemaOrUpdater) => {
        if (typeof newSchemaOrUpdater === "function") {
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
        };

        saveGroup({
            id: state.id,
            payload,
            isUpdate: !isNewGroup,
        }, {
            onSuccess: (data) => {
                if (!isNewGroup) return;
                const group = data?.data ?? data;
                const nextId = group?.id;
                if (nextId) router.push(`/admin/groups/${nextId}/edit`);
            },
        });
    };

    const handleRefresh = async () => {
        if (isNewGroup) {
            dispatch({ type: "RESET_GROUP" });
            return;
        }
        if (!onRefresh) return;
        try {
            const result = await onRefresh();
            const refreshedGroup = result?.data?.data ?? result?.data;
            if (refreshedGroup) {
                dispatch({ type: "LOAD_GROUP", payload: refreshedGroup });
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

    const gridContent = (
        <div className="grid grid-cols-12 gap-4">
            <Canvas dragSource={dragSource} schemaTitle={state.title}
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
                                <h3 className="text-lg font-semibold text-neutral-200">Grubunuzu oluşturmaya başlayın</h3>
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
                <GroupLibrary layout="grid"
                    onSave={handleSave}
                    onRefresh={handleRefresh}
                    onDelete={!isNewGroup ? () => setDeleteOverlayOpen(true) : undefined}
                    isPending={isPending}
                    isSuccess={isSuccess}
                    isError={isError}
                    error={error}
                    isDeleteDisabled={isNewGroup || isDeletePending}
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
                            <GroupLibrary layout="drawer"
                                onSave={handleSave}
                                onRefresh={handleRefresh}
                                onDelete={!isNewGroup ? () => setDeleteOverlayOpen(true) : undefined}
                                isPending={isPending}
                                isSuccess={isSuccess}
                                isError={isError}
                                error={error}
                                isDeleteDisabled={isNewGroup || isDeletePending}
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

                <ApprovalOverlay open={deleteOverlayOpen} preset="delete-form" context={{ isPending: isDeletePending }}
                    onApprove={() => deleteGroup(state.id, { onSuccess: () => router.push("/admin/groups"), onError: () => setDeleteOverlayOpen(false) })}
                    onReject={() => setDeleteOverlayOpen(false)}
                />
            </div>
        </DndContext>
    );
}

export default function GroupEditor({ initialGroup = null, onRefresh }) {
    const normalizedInitialData = initialGroup ? {
        id: initialGroup.id,
        schema: initialGroup.schema || [],
        title: initialGroup.title || "Yeni Grup",
        description: initialGroup.description || "",
    } : null;

    return (
        <GroupEditorProvider initialData={normalizedInitialData}>
            <GroupEditorContent onRefresh={onRefresh} isNewGroup={!initialGroup?.id} />
        </GroupEditorProvider>
    );
}