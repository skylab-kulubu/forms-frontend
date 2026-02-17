import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion"
import { useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { COMPONENTS } from "@/app/components/form-registry";

export function LibraryComponents({ layout = "grid", onSelect }) {
    return (
        <div className="grid grid-cols-1 gap-2 p-2 space-y-1">
            {COMPONENTS.map((component) => (
                <LibraryItem key={component.type} item={component} layout={layout} onSelect={onSelect} />
            ))}
        </div>
    );
}

export function LibraryItem({ item, onSelect, layout = "grid" }) {
    const isDraggable = layout === "grid";

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `component-${item.type}`,
        data: { from: "library", type: item.type },
        disabled: !isDraggable
    });

    const [justAdded, setJustAdded] = useState(false);

    const handleClick = () => {
        if (!onSelect || isDragging) return;        
        onSelect(item);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 600);
    };

    const style = isDraggable ? {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 9999 : "auto",
        position: isDragging ? "relative" : "static",
    } : {};

    if (layout === "drawer") {
        return (
            <motion.button type="button" onClick={handleClick} whileTap={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.08)" }}
                animate={justAdded ? { backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 0.4)" } : { backgroundColor: "rgba(23, 23, 23, 0.6)", borderColor: "rgba(255, 255, 255, 0.05)" }}
                className="group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
            >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-neutral-900 border border-white/10 text-neutral-400 group-hover:text-neutral-200">
                     <item.icon size={20} /> 
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-200 group-hover:text-neutral-50">{item.label}</p>
                    <p className="text-[11px] text-neutral-500 truncate">Forma eklemek için dokunun</p>
                </div>

                <div className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${justAdded ? "bg-emerald-500 text-emerald-950" : "bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-neutral-200"}`}>
                    {justAdded ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                </div>
            </motion.button>
        );
    }

    return (
        <motion.div ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={handleClick}
            animate={justAdded ? { scale: [1, 0.95, 1], filter: "brightness(1.3)" } : { scale: 1, filter: "brightness(1)" }} whileHover={{ scale: 1.02 }}
            className="cursor-grab active:cursor-grabbing relative rounded-xl overflow-hidden"
        >
            {justAdded && (
                <motion.div layoutId="added-flash" className="absolute inset-0 z-10 roundedbg-emerald-500/20 border-2 border-emerald-500/50 pointer-events-none"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                />
            )}
            
            <img src={item.svg} alt={item.label} className="w-full h-auto max-w-md block select-none pointer-events-none" />
        </motion.div>
    )
}
