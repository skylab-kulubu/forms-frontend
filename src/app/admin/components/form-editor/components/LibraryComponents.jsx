import { useDraggable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ChevronsUpDown, GripVertical, Layers, Plus, Search } from "lucide-react";
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
        <div ref={ref}>
            <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"><ChevronsUpDown size={13} /></span>
                <button type="button" onClick={() => setOpen((p) => !p)}
                    className="flex w-full items-center rounded-lg border border-white/10 bg-neutral-900/60 pl-8 pr-3 py-2 text-left text-xs text-neutral-400 transition hover:bg-white/5 focus:border-skylab-400/50 focus:outline-none"
                >
                    Hazır grup ekle...
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
                                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-white/10 ${isJustAdded ? "bg-skylab-500/10" : ""}`}
                                    >
                                        <Layers size={13} className={isJustAdded ? "text-skylab-300" : "text-neutral-500"} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-neutral-200 truncate">{group.title}</p>
                                        </div>
                                        <span className="text-3xs text-neutral-600 shrink-0">{count} bileşen</span>
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

const CATEGORIES = [
    { label: "Metin", types: ["short_text", "long_text", "link"] },
    { label: "Seçim", types: ["toggle", "combobox", "multi_choice", "slider", "matrix"] },
    { label: "Tarih & Saat", types: ["date", "time"] },
    { label: "Diğer", types: ["file", "separator"] },
];

export function LibraryComponents({ layout = "grid", onSelect, onGroupSelect }) {
    const [search, setSearch] = useState("");

    if (layout === "drawer") {
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

    const query = search.trim().toLowerCase();
    const byType = Object.fromEntries(COMPONENTS.map((c) => [c.type, c]));
    const sections = CATEGORIES.map((category) => ({
        ...category,
        items: category.types
            .map((type) => byType[type])
            .filter((c) => c && (!query || c.label.toLowerCase().includes(query))),
    })).filter((section) => section.items.length > 0);

    return (
        <div>
            <div className="flex flex-col gap-1.5 px-2 pt-2">
                <div className="relative">
                    <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bileşen ara..."
                        className="w-full rounded-lg border border-white/10 bg-neutral-900/60 py-2 pl-8 pr-3 text-xs text-neutral-200 placeholder-neutral-600 transition-colors focus:border-skylab-400/50 focus:outline-none"
                    />
                </div>
                {onGroupSelect && <GroupPicker onGroupSelect={onGroupSelect} />}
            </div>
            <div className="flex flex-col gap-4 p-2">
                {sections.length === 0 ? (
                    <p className="px-1 py-4 text-center text-2xs text-neutral-600">Eşleşen bileşen yok.</p>
                ) : (
                    sections.map((section) => (
                        <div key={section.label}>
                            <div className="mb-2 flex items-center gap-2 px-1">
                                <span className="text-2xs font-medium text-neutral-500">{section.label}</span>
                                <span className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {section.items.map((component) => (
                                    <LibraryItem key={component.type} item={component} layout={layout} onSelect={onSelect} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
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
                animate={justAdded ? { backgroundColor: "rgba(129, 140, 248, 0.18)", borderColor: "rgba(129, 140, 248, 0.4)" } : { backgroundColor: "rgba(23, 23, 23, 0.6)", borderColor: "rgba(255, 255, 255, 0.05)" }}
                className="group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
            >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-neutral-900 border border-white/10 text-neutral-400 group-hover:text-neutral-200">
                     <item.icon size={20} /> 
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-200 group-hover:text-neutral-50">{item.label}</p>
                    <p className="text-2xs text-neutral-500 truncate">Forma eklemek için dokunun</p>
                </div>

                <div className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${justAdded ? "bg-skylab-500 text-skylab-900" : "bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-neutral-200"}`}>
                    {justAdded ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                </div>
            </motion.button>
        );
    }

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={handleClick} aria-label={item.label}
            className="group/tile relative flex cursor-grab select-none items-center gap-1 active:cursor-grabbing"
        >
            <div className="flex w-4 shrink-0 items-center justify-center self-stretch rounded-md text-neutral-700 transition-colors group-hover/tile:bg-white/5 group-hover/tile:text-neutral-400">
                <GripVertical size={12} />
            </div>
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg">
                <Image src={item.svg} alt={item.label} width={400} height={200} className="pointer-events-none block h-auto w-full select-none" />
                <AnimatePresence>
                    {justAdded && (
                        <motion.div key="added-flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="pointer-events-none absolute inset-0 rounded-lg border-2 border-skylab-400/50 bg-skylab-400/15"
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
