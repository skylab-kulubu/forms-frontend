"use client";

import { useState } from "react";
import { DndContext, useDndContext, useDraggable, useDroppable, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from "framer-motion"
import { Trash, Trash2, CopyPlus, PackagePlus } from "lucide-react";

import { COMPONENTS, REGISTRY } from "./form-registry";

function LibraryPanel({ children }) {
    const { setNodeRef, isOver } = useDroppable({ id: "library" });
    const { active } = useDndContext();

    const from = active?.data?.current?.from;
    const showTrash = from === "canvas";

    return (
        <motion.div ref={setNodeRef} className="relative col-span-4 min-h-[60vh] max-h-screen overflow-y-auto rounded-xl p-3 scrollbar"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <motion.div className="flex flex-col h-full rounded-xl"
                animate={{ opacity: showTrash ? 0 : 1, y: showTrash ? 6 : 0, scale: showTrash ? 0.98 : 1 }}
                transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
                style={{ pointerEvents: showTrash ? "none" : "auto" }}
            >
                <h3 className="text-sm font-semibold text-neutral-200 tracking-wide px-4 pt-3 pb-2 border-b border-neutral-800">
                    Bileşenler
                </h3>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 scrollbar">
                    {children}
                </div>
            </motion.div>

            <AnimatePresence>
                {showTrash && (
                    <motion.div key="trash-overlay" className={`m-4 rounded-xl pointer-events-none bg-neutral-100/2 absolute inset-0 grid place-items-center border-3 ${isOver ? "border-red-500/60" : "border-neutral-200/30 border-dashed"}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            {isOver ? (
                                <Trash2 size={56} className="text-red-500/60 drop-shadow-sm animate-pulse" />
                            ) : (
                                <Trash size={56} className="text-neutral-600" />
                            )}
                            <span className={`font-semibold text-sm tracking-wide transition-colors ${isOver ? "text-red-600/60 animate-pulse" : "text-neutral-400/50"}`}
                            >
                                Bileşeni buraya bırakarak silebilirsiniz
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
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

  const entry = REGISTRY[type];
  if (!entry) return null;

  const Preview = entry.Create;

  const model = from === "canvas" ? schema.find(f => f.id === active.id)?.props : entry.defaults;
  const qn = from === "canvas" ? schema.findIndex(f => f.id === active.id) + 1 : "X";

  return (
    <div className="pointer-events-none select-none opacity-80 scale-[0.98] blur-[2]">
      <Preview questionNumber={qn} props={model} readOnly={true}/>
    </div>
  );
}


function Canvas({ children, dragSource }) {
    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

    return (
        <div ref={setNodeRef} className={`col-span-8 min-h-[60vh] max-h-screen overflow-y-auto rounded-xl p-3 my-4 transition border-2 scrollbar-hidden 
            ${isOver && dragSource !== "canvas" ? "border-emerald-400/50 bg-emerald-600/5" : "border-transparent"}`}
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
        <div ref={setNodeRef} className={`relative my-1 transition-all duration-200 ${isOver ? "h-10" : "h-2"}`}>
            <div className={`relative rounded-md max-w-2xl mx-auto ${isOver ? "h-10 bg-green-500/20 border-2 border-emerald-400/60 border-dashed" : "h-2"}`}>
                {isOver && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
                        <CopyPlus className="w-4 h-4 text-emerald-600" />
                    </div>
                )}
            </div>
        </div>
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
                <Canvas dragSource={dragSource}>
                    {schema.length === 0 ? (
                        <div className="grid h-[80vh] place-items-center text-sm text-neutral-500">
                            <div>
                                <PackagePlus size={36} className="mx-auto my-4" />
                                <span className="font-semibold">Paletten sürükleyip kanvasa bırak</span>
                            </div>
                        </div>
                    ) : (
                        <SortableContext items={schema.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                            <ul className="flex flex-col gap-2 max-w-2xl mx-auto mb-4">
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
