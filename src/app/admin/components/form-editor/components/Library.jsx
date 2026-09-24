import { useState } from "react";
import { LibraryComponents } from "./LibraryComponents";
import { LibrarySettings } from "./LibrarySettings";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Trash, Trash2 } from "lucide-react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import dynamic from "next/dynamic";
import { PanelTabs, SectionHeader, panelShellClass } from "@/app/admin/components/utils/SidePanel";

const LibraryTipTap = dynamic(() => import("./LibraryTipTap").then((mod) => mod.LibraryTipTap), { ssr: false });

const TABS = [
    { id: "components", label: "Bileşenler" },
    { id: "settings", label: "Ayarlar" },
    { id: "description", label: "Açıklama" },
];

export function Library({ layout = "grid", onLibrarySelect, onGroupSelect, isLockedDrag = false }) {
    const [activeTab, setActiveTab] = useState("components");
    const { setNodeRef, isOver } = useDroppable({ id: "library" });
    const { active } = useDndContext();
    const from = active?.data?.current?.from;
    const showTrash = from === "canvas";
    const isDeleteTarget = isOver && !isLockedDrag;

    const renderContent = () => {
        switch (activeTab) {
            case "components":
                return <LibraryComponents layout={layout} onSelect={onLibrarySelect} onGroupSelect={onGroupSelect} />;

            case "settings":
                return <LibrarySettings />;

            case "description":
                return (
                    <div className="flex h-full min-h-0 flex-col gap-4 p-4 text-sm text-neutral-200">
                        <SectionHeader title="Form açıklaması" description="Formu görüntüleyen kişiler için kısa bir açıklama ekleyin." />
                        <div className="flex min-h-0 flex-1 flex-col">
                            <LibraryTipTap />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <motion.div ref={setNodeRef} className={panelShellClass(layout)}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <motion.div className="flex h-full min-w-0 flex-1 flex-col rounded-xl"
                animate={{ opacity: showTrash ? 0 : 1, y: showTrash ? 6 : 0, scale: showTrash ? 0.98 : 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ pointerEvents: showTrash ? "none" : "auto" }}
            >
                <PanelTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
                <div className={`min-h-0 flex-1 ${activeTab === "settings" ? "overflow-y-auto overflow-x-hidden scrollbar" : "flex flex-col overflow-hidden"}`}>
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
                    <motion.div key="trash-overlay" className={`m-4 rounded-xl pointer-events-none bg-neutral-100/2 absolute inset-0 grid place-items-center border-3 ${isDeleteTarget ? "border-red-500/60" : "border-neutral-200/30 border-dashed"}`}
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            {isLockedDrag ? (
                                <Lock size={48} className="text-neutral-600" />
                            ) : isDeleteTarget ? (
                                <Trash2 size={56} className="text-red-500/60 drop-shadow-sm animate-pulse" />
                            ) : (
                                <Trash size={56} className="text-neutral-600" />
                            )}
                            <span className={`font-semibold text-sm tracking-wide transition-colors ${isDeleteTarget ? "text-red-600/60 animate-pulse" : "text-neutral-400/50"}`}
                            >
                                {isLockedDrag ? "Bu soru akış koşulunda kullanılıyor, silinemez" : "Bileşenleri buraya bırakarak silebilirsiniz"}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
