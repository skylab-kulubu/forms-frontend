import { useState, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { REGISTRY } from "@/app/components/form-registry";

export function useFormDnD(schema, setSchema, libraryDropElRef) {
    const [dragSource, setDragSource] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const lastOverRef = useRef(null)

    const onDragStart = ({ active }) => {
        const from = active.data?.current?.from ?? null;
        setDragSource(from);
        setActiveDragItem(active);
    };

    const onDragOver = ({ over }) => {
        lastOverRef.current = over?.id ?? null;
    };

    const onDragCancel = () => {
        setDragSource(null);
        setActiveDragItem(null);
        lastOverRef.current = null;
    };

    const onDragEnd = ({ active, over }) => {
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
            if (over?.id !== "canvas" && slotIndex === null) {
                resetDragState();
                return;
            }

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

            setSchema((prev) => {
                const newSchema = prev.filter((field) => field.id !== fieldId);
                return newSchema.map(field => {
                    if (field.condition && field.condition.fieldId === fieldId) {
                        const { condition, ...rest } = field;
                        return rest;
                    }
                    return field;
                });
            });

            resetDragState();
            return;
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

        if (from === "canvas" && over?.id && active.id !== over.id && !over.id.startsWith("slot-")) {
            setSchema((prev) => {
                const oldIndex = prev.findIndex((field) => field.id === active.id);
                const newIndex = prev.findIndex((field) => field.id === over.id);

                if (oldIndex === -1 || newIndex === -1) return prev;
                return arrayMove(prev, oldIndex, newIndex);
            });
        }

        resetDragState();
    };

    const resetDragState = () => {
        setDragSource(null);
        setActiveDragItem(null);
        lastOverRef.current = null;
    };

    return {
        dragSource,
        activeDragItem,
        handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel }
    };
}