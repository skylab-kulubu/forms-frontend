import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { motion } from "framer-motion"
import { CopyPlus, PencilLine } from "lucide-react";

import { REGISTRY } from "../../../../components/form-registry";

export function GhostComponent({ active, schema }) {
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
            <Preview questionNumber={qn} props={model} readOnly={true} />
        </div>
    );
}


export function Canvas({ children, dragSource, schemaTitle, setSchemaTitle }) {
    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
    const showDrop = isOver && dragSource === "library";

    return (
        <motion.div className="col-span-8 min-h-[80vh] max-h-[88vh] p-2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <div className="max-w-3xl mx-auto px-4 h-10 flex items-center border-b border-neutral-800">
                <div className="relative w-full">
                    <input id="form-title" type="text" placeholder="Yeni Form"
                        value={schemaTitle} onChange={(e) => setSchemaTitle(e.target.value)}
                        className="w-full pr-5 bg-transparent text-sm font-semibold text-neutral-200 tracking-wide outline-none leading-none placeholder-neutral-600"
                    />
                    {schemaTitle?.trim() && (
                        <PencilLine size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500" />
                    )}
                </div>
            </div>
            <motion.div ref={setNodeRef} className={`overflow-y-auto rounded-xl transition border-2 scrollbar-hidden h-full
                ${isOver && dragSource !== "canvas" ? "border-emerald-400/50 bg-emerald-600/5" : "border-transparent"}`}
                animate={{ scale: showDrop ? 0.99 : 1 }}
                transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

export function CanvasItem({ field, index, onPatch }) {
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

export function DropSlot({ index, enabled }) {
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
