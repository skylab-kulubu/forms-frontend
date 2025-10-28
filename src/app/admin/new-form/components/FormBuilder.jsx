"use client";

import { useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

import { COMPONENTS } from "./form-registry";

function LibraryPanel({ children }) {
    const { setNodeRef, isOver } = useDroppable({ id: "library" });

    return (
        <div className={`col-span-4 min-h-[60vh] max-h-screen overflow-y-auto rounded-xl p-3 transition border 
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
    }

    return (
        <button ref={setNodeRef} {...listeners} {...attributes} style={style}>
            <img src={item.svg} alt={item.label} />
        </button>
    )
}

function Canvas({ children }) {
    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

    return (
        <div ref={setNodeRef} className={`col-span-8 min-h-[60vh] rounded-xl p-3 transition border 
            ${isOver ? "border-emerald-400/50 bg-emerald-500/5" : "border-transparent"}`}
        >
            {children}
        </div>
    )
}

export default function FormBuilder() {
    const [schema, setSchema] = useState([]);

    return (
        <DndContext onDragEnd={({ active, over }) => {
            const from = active.data?.current?.from;

            if (from === "library" && over?.id === "canvas") {
                const type = active.data.current.type;
                const id = Math.random().toString(36).slice(2, 10);
                setSchema((prev) => [...prev, { id, type }]);
            }
            if (from === "canvas" && over?.id === "library") {
                const fieldId = active.data.current.id;
                setSchema((prev) => prev.filter((f) => f.id !== fieldId));
            }
        }}>
            <div className="grid grid-cols-12 gap-4">
                <Canvas>
                    canvas yapıcam buraya
                </Canvas>

                <LibraryPanel>
                    <div className="grid grid-cols-1 gap-2 p-6">
                        {COMPONENTS.map((component) => (
                            <LibraryItem key={component.type} item={component} />
                        ))}
                    </div>
                </LibraryPanel>
            </div>
        </DndContext>
    )
}