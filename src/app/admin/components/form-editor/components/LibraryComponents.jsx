import { useDraggable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronsUpDown, Layers, Plus } from "lucide-react";
import { COMPONENTS } from "@/app/components/form-registry";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import SearchPicker from "@/app/components/utils/SearchPicker";

function GroupPicker({ onGroupSelect }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [justAdded, setJustAdded] = useState(null);
    const ref = useRef(null);

    const { data: groupsData } = useGroupsQuery({ pageSize: 50 });
    const groups = useMemo(() => {
        const items = groupsData?.data?.items ?? [];
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((g) => g.title?.toLowerCase().includes(q));
    }, [groupsData, search]);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const handleSelect = (group) => {
        onGroupSelect?.(group);
        setJustAdded(group.id);
        setTimeout(() => setJustAdded(null), 800);
        setOpen(false);
        setSearch("");
    };

    return (
        <div className="px-3 pt-3 pb-1" ref={ref}>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">Grup ekle</label>
            <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"><ChevronsUpDown size={13} /></span>
                <button type="button" onClick={() => setOpen((p) => !p)}
                    className="flex w-full items-center rounded-lg border border-white/10 bg-neutral-900/60 pl-8 pr-3 py-2 text-left text-[12px] text-neutral-400 transition hover:bg-white/5 focus:border-white/20 focus:outline-none"
                >
                    Grup seçin...
                </button>

                <AnimatePresence>
                    {open && (
                        <SearchPicker searchValue={search} onSearchChange={setSearch} autoFocus items={groups} itemsPerPage={4}
                            getItemId={(g) => g.id} onSelect={handleSelect} footerText="Gruptaki tüm bileşenler eklenir."
                            renderItem={(group, { onSelect }) => {
                                const count = Array.isArray(group.schema) ? group.schema.length : 0;
                                const isJustAdded = justAdded === group.id;
                                return (
                                    <button type="button" onClick={onSelect}
                                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-white/10 ${isJustAdded ? "bg-emerald-500/10" : ""}`}
                                    >
                                        <Layers size={13} className={isJustAdded ? "text-emerald-400" : "text-neutral-500"} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-medium text-neutral-200 truncate">{group.title}</p>
                                        </div>
                                        <span className="text-[10px] text-neutral-600 shrink-0">{count} bileşen</span>
                                    </button>
                                );
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export function LibraryComponents({ layout = "grid", onSelect, onGroupSelect }) {
    return (
        <div>
            {onGroupSelect && <GroupPicker onGroupSelect={onGroupSelect} />}
            <div className="grid grid-cols-1 gap-2 p-2 space-y-1">
                {COMPONENTS.map((component) => (
                    <LibraryItem key={component.type} item={component} layout={layout} onSelect={onSelect} />
                ))}
            </div>
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
            
            <img src={item.svg} alt={item.label} className="w-full h-auto block select-none pointer-events-none" />
        </motion.div>
    )
}
