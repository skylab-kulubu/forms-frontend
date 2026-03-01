import { LibraryComponents } from "../form-editor/components/LibraryComponents";
import { useGroupEditor } from "./GroupEditorContext";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, CircleGauge, RotateCcw, Trash, Trash2 } from "lucide-react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import ErrorPopover from "@/app/components/utils/Popover";

export function GroupLibrary({ layout = "grid", onLibrarySelect, onSave, onRefresh, onDelete, isPending, isError, error, isSuccess, isDeleteDisabled }) {
    const { setNodeRef, isOver } = useDroppable({ id: "library" });
    const { active } = useDndContext();
    const from = active?.data?.current?.from;
    const showTrash = from === "canvas";
    const layoutClass = layout === "drawer" ? "h-full w-full pt-8" : "col-span-4 h-[93vh]";

    const { state, dispatch } = useGroupEditor();

    return (
        <motion.div ref={setNodeRef} className={`relative flex min-w-0 rounded-xl p-2 overflow-hidden max-w-xl ${layoutClass}`}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <motion.div className="flex h-full min-w-0 flex-1 flex-col rounded-xl"
                animate={{ opacity: showTrash ? 0 : 1, y: showTrash ? 6 : 0, scale: showTrash ? 0.98 : 1 }}
                transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
                style={{ pointerEvents: showTrash ? "none" : "auto" }}
            >
                <div className="h-10 flex flex-wrap-reverse items-center justify-start gap-y-1 px-4 text-sm tracking-wide border-b border-neutral-800 overflow-visible">
                    <div className="flex items-center grow justify-center sm:justify-start mr-4">
                        <span className="font-semibold text-neutral-200">Bileşenler</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-neutral-500">
                        <button type="button" aria-label="Yenile" onClick={onRefresh} disabled={!onRefresh}
                            className={`rounded-lg p-1.5 transition-colors ${onRefresh ? "hover:text-neutral-100 hover:bg-neutral-800/70" : "opacity-50 cursor-not-allowed"}`}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button type="button" aria-label="Grubu sil" onClick={onDelete} disabled={isDeleteDisabled}
                            className={`rounded-lg p-1.5 transition-colors ${isDeleteDisabled ? "opacity-50 cursor-not-allowed" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                        >
                            <Trash2 size={16} />
                        </button>
                        <ErrorPopover open={isError} error={error} align="bottom-right" onClose={() => { }}>
                            <button onClick={onSave} disabled={isPending} type="button" aria-label="Onayla" className="rounded-lg p-1.5 hover:text-neutral-100 hover:bg-neutral-800/70 transition-colors">
                                {isPending ? (<CircleGauge size={16} className="animate-spin" />) : isError ? (<CircleAlert size={16} className="text-red-400" />) : isSuccess ? (<CheckCircle2 size={16} className="text-indigo-400" />) : (<CheckCircle2 size={16} />)}
                            </button>
                        </ErrorPopover>
                    </div>
                </div>

                <div className="space-y-3 p-4 border-b border-neutral-800">
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                            Grup Açıklaması
                        </label>
                        <textarea value={state.description}
                            onChange={(e) => dispatch({ type: "SET_DESCRIPTION", payload: e.target.value })}
                            placeholder="Bu grup hakkında kısa bir açıklama..."
                            rows={2}
                            className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 p-1 overflow-y-auto overflow-x-hidden scrollbar">
                    <LibraryComponents layout={layout} onSelect={onLibrarySelect} />
                </div>
            </motion.div>

            <AnimatePresence>
                {showTrash && (
                    <motion.div key="trash-overlay" className={`m-4 rounded-xl pointer-events-none bg-neutral-100/2 absolute inset-0 grid place-items-center border-3 ${isOver ? "border-red-500/60" : "border-neutral-200/30 border-dashed"}`}
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
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