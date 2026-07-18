import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from "framer-motion"
import { ArrowDown, ArrowUp, Copy, CopyPlus, PencilLine, Plus, Trash2 } from "lucide-react";

import { REGISTRY, COMPONENTS } from "../../../../components/form-registry";

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


export function Canvas({ children, dragSource, schemaTitle, setSchemaTitle, span = 8, toolbar }) {
    const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
    const showDrop = isOver && dragSource === "library";
    const spanClass = span === 12 ? "col-span-12" : span === 11 ? "col-span-11" : "col-span-8";

    return (
        <motion.div className={`${spanClass} flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col p-2`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <div className="w-full max-w-3xl mx-auto px-4 h-10 flex items-center gap-2 border-b border-white/10">
                <div className="relative flex-1 min-w-0">
                    <input id="form-title" type="text" placeholder="Yeni Form"
                        value={schemaTitle} onChange={(e) => setSchemaTitle(e.target.value)}
                        className="w-full pr-5 bg-transparent text-sm font-semibold text-neutral-200 tracking-wide outline-none leading-none placeholder-neutral-600"
                    />
                    {schemaTitle?.trim() && (
                        <PencilLine size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500" />
                    )}
                </div>
                {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
            </div>
            <motion.div ref={setNodeRef} className={`overflow-y-auto rounded-xl transition border-2 scrollbar-hidden min-h-0 flex-1
                bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px] bg-local
                ${isOver && dragSource !== "canvas" ? "border-skylab-400/50 bg-skylab-500/5" : "border-transparent"}`}
                animate={{ scale: showDrop ? 0.99 : 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

function ItemActionButton({ label, onClick, disabled, danger, children }) {
    return (
        <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
            className={`grid size-6 place-items-center rounded-md text-neutral-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40
                ${disabled ? "opacity-30 cursor-not-allowed" : danger ? "hover:bg-red-500/10 hover:text-red-300" : "hover:bg-white/10 hover:text-neutral-200"}`}
        >
            {children}
        </button>
    );
}

export function CanvasItem({ field, index, onUpdate, schema, dragActive, onDuplicate, onDelete, onMove, canMoveUp, canMoveDown }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
        data: { from: "canvas", id: field.id },
    });

    const style = { transform: CSS.Transform.toString(transform), transition };
    const entry = REGISTRY[field.type];
    const FormComponent = entry?.Create;
    const hasActions = Boolean(onDuplicate && onDelete && onMove);

    const isSeparator = field.type === "separator";
    const questionNumber = isSeparator ? "—" : schema ? schema.slice(0, index).filter(f => f.type !== "separator").length : index;

    const availableFields = schema ? schema.slice(0, index - 1).filter(f => f.type !== "separator")
          .map(f => ({
            id: f.id,
            title: f.props.question || "İsimsiz Soru",
            type: f.type,
            choices: f.props.choices || [],
            inputType: f.props.inputType || "text"
          })) : [];

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
            className="group/item relative cursor-grab active:cursor-grabbing"
        >
            {!dragActive && hasActions && (
                <div className="pointer-events-none absolute -top-3 left-3 z-20 flex translate-y-1 items-center gap-0.5 rounded-lg border border-white/15 bg-neutral-900 px-1 py-0.5 opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover/item:pointer-events-auto group-hover/item:translate-y-0 group-hover/item:opacity-60 hover:opacity-100! focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100">
                    <ItemActionButton label="Yukarı taşı" onClick={() => onMove(field.id, -1)} disabled={!canMoveUp}>
                        <ArrowUp size={13} />
                    </ItemActionButton>
                    <ItemActionButton label="Aşağı taşı" onClick={() => onMove(field.id, 1)} disabled={!canMoveDown}>
                        <ArrowDown size={13} />
                    </ItemActionButton>
                    <ItemActionButton label="Çoğalt" onClick={() => onDuplicate(field.id)}>
                        <Copy size={13} />
                    </ItemActionButton>
                    <span className="mx-0.5 h-4 w-px bg-white/10" />
                    <ItemActionButton label="Sil" onClick={() => onDelete(field.id)} danger>
                        <Trash2 size={13} />
                    </ItemActionButton>
                </div>
            )}
            {FormComponent ? (
                <FormComponent questionNumber={questionNumber} props={field.props}
                    onPropsChange={(next) => onUpdate(field.id, { props: next })} 
                    condition={field.condition}
                    onConditionChange={(cond) => onUpdate(field.id, { condition: cond })}
                    availableFields={availableFields}
                />
            ) : null}
        </div>
    );
}

export function InsertSlot({ index, onInsert, hidden }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const handleKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleDown);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleDown);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    if (hidden) return <div className="h-2" />;

    return (
        <div ref={ref} className="group/ins relative mx-auto w-full max-w-2xl">
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div key="picker" className="overflow-hidden"
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="my-1 flex flex-wrap items-center justify-center gap-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1.5 shadow-lg">
                            {COMPONENTS.map((component) => (
                                <button key={component.type} type="button" aria-label={component.label}
                                    onClick={() => { onInsert(index, component.type); setOpen(false); }}
                                    className="flex w-18 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
                                >
                                    <component.icon size={15} />
                                    <span className="w-full truncate text-center text-3xs leading-none">{component.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!open && (
                <div className="flex h-2 items-center justify-center transition-[height] duration-200 group-hover/ins:h-8 focus-within:h-8">
                    <button type="button" onClick={() => setOpen(true)} aria-label="Araya bileşen ekle"
                        className="pointer-events-none z-10 flex -translate-y-0.5 items-center gap-1 rounded-full border border-white/15 bg-neutral-900 px-2 py-0.5 text-3xs font-medium text-neutral-400 opacity-0 shadow transition-[opacity,transform] duration-150 group-hover/ins:pointer-events-auto group-hover/ins:translate-y-0 group-hover/ins:opacity-100 hover:text-neutral-200 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
                    >
                        <Plus size={11} />
                        Ekle
                    </button>
                </div>
            )}
        </div>
    );
}

export function DropSlot({ index, enabled }) {
    const { setNodeRef, isOver } = useDroppable(enabled ? { id: `slot-${index}`, data: { index } } : { id: undefined });
    if (!enabled) return (<div className="h-2" />);
    return (
        <div ref={setNodeRef} className={`relative my-1 transition-all duration-200 ${isOver ? "h-10" : "h-2"}`}>
            <div className={`relative rounded-md max-w-2xl mx-auto ${isOver ? "h-10 bg-skylab-400/15 border-2 border-skylab-400/60 border-dashed" : "h-2"}`}>
                {isOver && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <CopyPlus className="w-4 h-4 text-skylab-300" />
                    </div>
                )}
            </div>
        </div>
    );
}
