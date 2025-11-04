"use client";

import { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';

import { COMPONENTS, REGISTRY } from "./form-registry";

function LibraryPanel({ children }) {
    const { setNodeRef, isOver } = useDroppable({ id: "library" });

    return (
        <div ref={setNodeRef} className={`col-span-4 min-h-[60vh] max-h-screen overflow-y-auto rounded-xl p-3 transition border 
            ${isOver ? "border-red-400/50 bg-red-500/5" : "border-transparent"}`}
        >
            <h3 className="mb-2 text-sm font-semibold">Bileşenler</h3>
            {children}
        </div>
    )
}

function LibraryItem({ item }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `component-${item.type}`,
        data: { from: "library", type: item.type }
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 9999 : "auto",
        position: isDragging ? "relative" : "static",
    }

    return (
        <button ref={setNodeRef} {...listeners} {...attributes} style={style}>
            <img src={item.svg} alt={item.label} />
        </button>
    )
}

function GhostComponent({ active, schema }) {
    if (!active) return null;
    const from = active.data?.current?.from;
    let type = active.data?.current?.type ?? null;

    if (!type && from === "canvas") {
        const node = schema.find(f => f.id === active.id);
        type = node?.type ?? null;
    }
    if (!type) return null;
    const item = COMPONENTS.find(c => c.type === type);
    if (!item) return null;
    return (
        <div className="pointer-events-none select-none opacity-90">
            <img src={item.svg} alt={item.label} />
        </div>
    );
}

function Canvas({ children }) {
    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

    return (
        <div ref={setNodeRef} className={`col-span-8 min-h-[60vh] overflow-y-auto rounded-xl p-3 transition border 
            ${isOver ? "border-emerald-400/50 bg-emerald-500/5" : "border-transparent"}`}
        >
            {children}
        </div>
    )
}

function CanvasItem({ field, index, onPatch }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
        data: { from: "canvas", id: field.id },
    });

    const style = { transform: CSS.Transform.toString(transform), transition };
    const entry = REGISTRY[field.type];
    const FormComponent = entry?.Create;

    const stopIfInteractive = (e) => {
        const el = e.target;
        if (
            el.closest('input, textarea, select, button, [contenteditable="true"], a, [role="textbox"]')
        ) {
            e.stopPropagation();
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
            onPointerDownCapture={stopIfInteractive} onMouseDownCapture={stopIfInteractive} onTouchStartCapture={stopIfInteractive}
            className="cursor-grab active:cursor-grabbing"
        >
            {FormComponent ? (
                <FormComponent questionNumber={index} props={field.props} onPropsChange={(next) => onPatch(field.id, next)} />
            ) : null}
        </div>
    );
}

function DropSlot({ index, enabled }) {
    const { setNodeRef, isOver } = useDroppable(enabled ? { id: `slot-${index}`, data: { index } } : { id: undefined });
    if (!enabled) return (<div className="h-2" />);
    return (
        <div ref={setNodeRef} className={`rounded transition ${isOver ? "bg-emerald-400/40 h-8 my-1" : "bg-transparent h-2"}`} />
    );
}

export default function FormBuilder() {
    const [schema, setSchema] = useState([]);
    const [dragSource, setDragSource] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);

    const patchField = (id, nextProps) => {
        setSchema(prev => prev.map(f => f.id === id ? { ...f, props: nextProps } : f));
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

                const getSlotIndex = (over) => {
                    if (!over?.id || typeof over.id !== "string") return null;
                    if (!over.id.startsWith("slot-")) return null;
                    const index = parseInt(over.id.split("slot-")[1], 10);
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
                        };
                        const newSchema = [...prev];
                        newSchema.splice(slotIndex, 0, { id, type, props });
                        return newSchema;
                    });
                }
                if (from === "canvas" && over?.id === "library") {
                    const fieldId = active.data.current.id;
                    setSchema((prev) => prev.filter((f) => f.id !== fieldId));
                }
                if (from === "canvas" && slotIndex !== null) {
                    setSchema((prev) => {
                        const oldIndex = prev.findIndex((f) => f.id === active.id);
                        if (oldIndex === -1) return prev;
                        const item = prev[oldIndex];
                        const base = prev.filter((_, i) => i !== oldIndex);
                        const target = slotIndex > oldIndex ? slotIndex - 1 : slotIndex;
                        base.splice(target, 0, item);
                        return base;
                    });
                }
                if (from === "canvas" && over?.id && active.id !== over.id) {
                    setSchema((prev) => {
                        const oldIndex = prev.findIndex((f) => f.id === active.id);
                        const newIndex = prev.findIndex((f) => f.id === over.id);
                        if (oldIndex === -1 || newIndex === -1) return prev;
                        return arrayMove(prev, oldIndex, newIndex);
                    });
                }
                setDragSource(null);
                setActiveDragItem(null);
            }}
            onDragCancel={() => { setDragSource(null); setActiveDragItem(null); }}
        >
            <div className="grid grid-cols-12 gap-4">
                <Canvas>
                    {schema.length === 0 ? (
                        <div className="grid h-[40vh] place-items-center text-sm text-neutral-400">
                            Paletten sürükleyip kanvasa bırak
                        </div>
                    ) : (
                        <SortableContext items={schema.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                            <ul className="flex flex-col gap-2">
                                <DropSlot index={0} enabled={dragSource === "library"} />
                                {schema.map((f, i) => (
                                    <li key={f.id} className="flex flex-col">
                                        <CanvasItem field={f} index={i + 1} onPatch={patchField} />
                                        <DropSlot index={i + 1} enabled={dragSource === "library"} />
                                    </li>
                                ))}
                            </ul>
                        </SortableContext>
                    )}
                </Canvas>

                <LibraryPanel>
                    <div className="grid grid-cols-1 gap-2 p-6">
                        {COMPONENTS.map((component) => (
                            <LibraryItem key={component.type} item={component} />
                        ))}
                    </div>
                </LibraryPanel>
            </div>

            <DragOverlay>
                {activeDragItem ? (
                    <GhostComponent active={activeDragItem} schema={schema} />
                ) : null}
            </DragOverlay>
        </DndContext >
    )
}