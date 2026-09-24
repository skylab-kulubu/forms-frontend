import { useState } from "react";
import { LibraryComponents } from "../form-editor/components/LibraryComponents";
import { useGroupEditor } from "./GroupEditorContext";
import { AnimatePresence, motion } from "framer-motion";
import { Trash, Trash2 } from "lucide-react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { PanelTabs, PanelTextarea, SectionHeader, panelShellClass } from "@/app/admin/components/utils/SidePanel";

const TABS = [
    { id: "components", label: "Bileşenler" },
    { id: "description", label: "Açıklama" },
];

export function GroupLibrary({ layout = "grid", onLibrarySelect }) {
    const [activeTab, setActiveTab] = useState("components");
    const { setNodeRef, isOver } = useDroppable({ id: "library" });
    const { active } = useDndContext();
    const from = active?.data?.current?.from;
    const showTrash = from === "canvas";

    const { state, dispatch } = useGroupEditor();

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
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full"
                        >
                            {activeTab === "components" ? (
                                <LibraryComponents layout={layout} onSelect={onLibrarySelect} />
                            ) : (
                                <div className="flex flex-col gap-4 p-4 text-sm text-neutral-200">
                                    <SectionHeader title="Grup açıklaması" description="Gruplar listesinde grup adının altında görünür." />
                                    <PanelTextarea rows={6} value={state.description} aria-label="Grup açıklaması" placeholder="Bu grup hakkında kısa bir açıklama..."
                                        onChange={(e) => dispatch({ type: "SET_DESCRIPTION", payload: e.target.value })}
                                    />
                                </div>
                            )}
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
                            <span className={`font-semibold text-sm tracking-wide transition-colors ${isOver ? "text-red-600/60 animate-pulse" : "text-neutral-400/50"}`}>
                                Bileşenleri buraya bırakarak silebilirsiniz
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
