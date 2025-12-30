import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, CircleGauge, CircleAlert, RotateCcw, Trash, Trash2 } from "lucide-react";

export function LibraryPanel({ children, activeTab = "components", onSelectTab, handleSave, onRefresh, onDelete, isDeleteDisabled, isPending, isError, isSuccess }) {
    const { setNodeRef, isOver } = useDroppable({ id: "library" });
    const { active } = useDndContext();

    const from = active?.data?.current?.from;
    const showTrash = from === "canvas";

    return (
        <motion.div ref={setNodeRef} className="relative col-span-4 flex h-[93vh] min-w-0 rounded-xl p-2 overflow-hidden"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <motion.div className="flex h-full min-w-0 flex-1 flex-col rounded-xl"
                animate={{ opacity: showTrash ? 0 : 1, y: showTrash ? 6 : 0, scale: showTrash ? 0.98 : 1 }}
                transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
                style={{ pointerEvents: showTrash ? "none" : "auto" }}
            >
                <div className="h-10 flex items-center justify-between px-4 text-sm tracking-wide border-b border-neutral-800">
                    <div className="flex items-center">
                        <button type="button"
                            className={`font-semibold transition-colors ${activeTab === "components" ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
                            onClick={() => onSelectTab && onSelectTab("components")}
                        >
                            Bileşenler
                        </button>
                        <span className="mx-2 h-3 w-px bg-neutral-800" />
                        <button type="button"
                            className={`font-semibold transition-colors ${activeTab === "settings" ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
                            onClick={() => onSelectTab && onSelectTab("settings")}
                        >
                            Ayarlar
                        </button>
                        <span className="mx-2 h-3 w-px bg-neutral-800" />
                        <button type="button"
                            className={`font-semibold transition-colors ${activeTab === "description" ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
                            onClick={() => onSelectTab && onSelectTab("description")}
                        >
                            Açıklama
                        </button>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500">
                        <button type="button" aria-label="Yenile" onClick={onRefresh} disabled={!onRefresh}
                            className={`rounded-lg p-1.5 transition-colors ${onRefresh ? "hover:text-neutral-100 hover:bg-neutral-800/70" : "opacity-50 cursor-not-allowed"}`}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button type="button" aria-label="Formu sil" onClick={onDelete} disabled={isDeleteDisabled}
                            className={`rounded-lg p-1.5 transition-colors ${isDeleteDisabled ? "opacity-50 cursor-not-allowed" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                        >
                            <Trash2 size={16} />
                        </button>
                        <button onClick={handleSave} disabled={isPending} type="button" aria-label="Onayla" className="rounded-lg p-1.5 hover:text-neutral-100 hover:bg-neutral-800/70 transition-colors">
                            {isPending ? (<CircleGauge size={16} className="animate-spin" />) : isError ? (<CircleAlert size={16} className="text-red-600" />) : isSuccess ? (<CheckCircle2 size={16} className="text-emerald-600" />) : (<CheckCircle2 size={16} />)}
                        </button>
                    </div>
                </div>

                <div className={`flex-1 min-h-0 p-1 ${activeTab === 'description' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overflow-x-hidden scrollbar'}`}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
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
                                Bileşenleri buraya bırakarak silebilirsiniz
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function LibraryItem({ item }) {
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