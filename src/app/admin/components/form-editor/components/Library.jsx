import { useState } from "react";
import { LibraryComponents } from "./LibraryComponents";
import { LibrarySettings } from "./LibrarySettings";
import { useFormEditor } from "../FormEditorContext";
import { AnimatePresence, motion } from "framer-motion";
import { Trash, Trash2 } from "lucide-react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import dynamic from "next/dynamic";

const LibraryTipTap = dynamic(() => import("./LibraryTipTap").then((mod) => mod.LibraryTipTap), { ssr: false });

export function Library({ layout = "grid", onLibrarySelect, onGroupSelect }) {
    const [activeTab, setActiveTab] = useState("components");
    const { setNodeRef, isOver } = useDroppable({ id: "library" });
    const { active } = useDndContext();
    const from = active?.data?.current?.from;
    const showTrash = from === "canvas";
    const layoutClass = layout === "drawer" ? "h-full w-full pt-8" : "col-span-4 h-[calc(100dvh-5.5rem)]";

    const { state } = useFormEditor();
    const { isChildForm } = state;

    const renderContent = () => {
        switch (activeTab) {
            case "components":
                return <LibraryComponents layout={layout} onSelect={onLibrarySelect} onGroupSelect={onGroupSelect} />;

            case "settings":
                return (
                    <div className="relative h-full">
                        <div className={isChildForm ? "pointer-events-none opacity-40" : ""}>
                            <LibrarySettings />
                        </div>
                        {isChildForm && (
                            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
                                <div className="mx-4 max-w-xs rounded-lg border border-neutral-700 bg-neutral-900/90 px-4 py-3 text-center shadow-lg">
                                    <p className="mb-1 text-sm font-semibold text-neutral-500 uppercase tracking-[0.18em]">Ayarlar kilitli</p>
                                    <p className="text-2xs leading-relaxed text-neutral-300">Bu formun ayarları ana form tarafından yönetilmektedir.</p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "description":
                return (
                    <div className="flex h-full min-h-0 flex-col gap-4 p-4 text-sm text-neutral-200">
                        <section className="flex flex-1 min-h-0 flex-col gap-4">
                            <div>
                                <p className="font-semibold text-neutral-100">Form açıklaması</p>
                                <p className="mt-1 text-2xs leading-relaxed text-neutral-500">
                                    Formu görüntüleyen kişiler için kısa bir açıklama ekleyin.
                                </p>
                            </div>
                            <div className="flex-1 min-h-0">
                                <LibraryTipTap />
                            </div>
                        </section>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <motion.div ref={setNodeRef} className={`relative flex min-w-0 rounded-xl p-2 overflow-hidden max-w-xl ${layoutClass}`}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <motion.div className="flex h-full min-w-0 flex-1 flex-col rounded-xl"
                animate={{ opacity: showTrash ? 0 : 1, y: showTrash ? 6 : 0, scale: showTrash ? 0.98 : 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ pointerEvents: showTrash ? "none" : "auto" }}
            >
                <div className="h-10 flex flex-wrap-reverse items-center justify-start gap-y-1 px-4 text-sm tracking-wide border-b border-neutral-800 overflow-visible">
                    <div className="flex items-center grow justify-center sm:justify-start">
                        <button type="button" onClick={() => setActiveTab("components")}
                            className={`font-semibold w-full transition-colors ${activeTab === "components" ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                            Bileşenler
                        </button>
                        <span className="mx-2 h-3 w-px bg-neutral-800" />
                        <button type="button" onClick={() => setActiveTab("settings")}
                            className={`font-semibold w-full transition-colors ${activeTab === "settings" ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                            Ayarlar
                        </button>
                        <span className="mx-2 h-3 w-px bg-neutral-800" />
                        <button type="button" onClick={() => setActiveTab("description")}
                            className={`font-semibold w-full transition-colors ${activeTab === "description" ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                            Açıklama
                        </button>
                    </div>
                </div>
                <div className={`flex-1 min-h-0 p-1 ${activeTab === "description" ? "overflow-hidden flex flex-col" : "overflow-y-auto overflow-x-hidden scrollbar"}`}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {showTrash && (
                    <motion.div key="trash-overlay" className={`m-4 rounded-xl pointer-events-none bg-neutral-100/2 absolute inset-0 grid place-items-center border-3 ${isOver ? "border-red-500/60" : "border-neutral-200/30 border-dashed"}`}
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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