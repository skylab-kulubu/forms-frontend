import { useDraggable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, GripVertical, Layers, Plus, Rows3 } from "lucide-react";
import { COMPONENTS } from "@/app/components/form-registry";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import SearchPicker from "@/app/components/utils/SearchPicker";
import { FOCUS_RING, PanelButton, PanelInput, ROW, ROW_HOVER, TILE } from "@/app/admin/components/utils/SidePanel";

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
        <div ref={ref} className="min-w-fit flex-1">
            <PanelButton icon={Layers} chevron active={open} aria-expanded={open} onClick={() => setOpen((p) => !p)} className="w-full">
                Hazır grup ekle
            </PanelButton>

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
    );
}

function RepeaterAddButton({ onSelect }) {
    const [added, setAdded] = useState(false);

    const handleClick = () => {
        onSelect?.({ type: "repeater" });
        setAdded(true);
        setTimeout(() => setAdded(false), 800);
    };

    return (
        <PanelButton icon={added ? CheckCircle2 : Rows3} active={added} onClick={handleClick} className="min-w-fit flex-1">
            {added ? "Grup eklendi" : "Tekrarlanan grup ekle"}
        </PanelButton>
    );
}

const CATEGORIES = [
    { label: "Metin", types: ["short_text", "long_text"] },
    { label: "Seçim", types: ["toggle", "combobox", "multi_choice", "slider", "matrix"] },
    { label: "Tarih & Saat", types: ["date", "time"] },
    { label: "Diğer", types: ["file", "separator"] },
];

export function LibraryComponents({ layout = "grid", onSelect, onGroupSelect }) {
    const [search, setSearch] = useState("");

    const query = search.trim().toLowerCase();
    const byType = Object.fromEntries(COMPONENTS.map((c) => [c.type, c]));
    const sections = CATEGORIES.map((category) => ({
        ...category,
        items: category.types
            .map((type) => byType[type])
            .filter((c) => c && (!query || c.label.toLowerCase().includes(query))),
    })).filter((section) => section.items.length > 0);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 flex-col gap-2 px-4 pt-3">
                <PanelInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bileşen ara..." aria-label="Bileşen ara" />
                <div className="relative flex flex-wrap gap-2">
                    {onGroupSelect && <GroupPicker onGroupSelect={onGroupSelect} />}
                    <RepeaterAddButton onSelect={onSelect} />
                </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden scrollbar px-4 pb-4 pt-3">
                {sections.length === 0 ? (
                    <p className="py-4 text-center text-2xs text-neutral-600">Eşleşen bileşen yok.</p>
                ) : (
                    sections.map((section) => (
                        <div key={section.label}>
                            <div className="mb-2 flex items-center gap-2">
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
            <button type="button" onClick={handleClick}
                className={`${ROW} ${FOCUS_RING} flex w-full items-center gap-3 px-3 py-2.5 text-left ${justAdded ? "border-skylab-400/40 bg-skylab-500/10" : `border-white/10 ${ROW_HOVER}`}`}
            >
                <span className={`${TILE} border-white/10 text-neutral-400`}>
                    <item.icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-100">{item.label}</span>
                    <span className="block truncate text-2xs text-neutral-500">Eklemek için dokunun</span>
                </span>
                <span className={`grid size-7 shrink-0 place-items-center rounded-lg transition-colors ${justAdded ? "bg-skylab-500 text-skylab-900" : "bg-white/5 text-neutral-400"}`}>
                    {justAdded ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                </span>
            </button>
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
                {item.svg ? (
                    <Image src={item.svg} alt={item.label} width={400} height={200} className="pointer-events-none block h-auto w-full select-none" />
                ) : (
                    <div className="pointer-events-none flex items-center gap-2.5 rounded-lg border border-white/10 bg-neutral-900 p-3 select-none">
                        <div className="grid size-6 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-neutral-400">
                            <item.icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-neutral-300">{item.label}</span>
                    </div>
                )}
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
