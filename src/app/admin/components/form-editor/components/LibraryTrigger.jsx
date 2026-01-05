import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronsLeft } from "lucide-react";
import { DrawerTrigger } from "../../utils/Drawer";

export const LibraryTrigger = forwardRef(({ dragSource, isDropOver, isLgUp }, ref) => {
    return (
        <div ref={ref} className="col-span-1 h-[92vh] flex items-center justify-end z-10">
            <DrawerTrigger asChild>
                <motion.button type="button" layout initial={false} animate={dragSource === "canvas" ? "dragging" : "idle"}
                    variants={{
                        idle: { width: "1.25rem", marginRight: "-1rem", borderTopLeftRadius: "9999px", borderBottomLeftRadius: "9999px",
                            borderTopRightRadius: "0px", borderBottomRightRadius: "0px", backgroundColor: "#121212", borderColor: "rgb(38 38 38)", x: 0
                        },
                        dragging: { width: "100%", marginRight: "0rem", borderTopLeftRadius: "9999px", borderBottomLeftRadius: "9999px",
                            borderTopRightRadius: "9999px", borderBottomRightRadius: "9999px", backgroundColor: isDropOver ? "rgba(239, 68, 68, 0.1)" : "rgba(10, 10, 10, 0.6)",borderColor: isDropOver ? "rgba(239, 68, 68, 0.7)" : "rgba(64, 64, 64, 0.8)", x: 0
                        }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="relative flex h-full items-center justify-center border border-r-0 overflow-hidden focus:outline-none shadow-sm"
                    title={dragSource === "canvas" ? "Bırak ve sil" : "Paneli aç"}
                >
                    <AnimatePresence mode="popLayout">
                        {dragSource === "canvas" ? (
                            <motion.div key="trash-icon" className="flex flex-col items-center justify-center gap-2"
                                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}
                            >
                                <Trash2 size={20} className={isDropOver ? "text-red-400" : "text-neutral-400"} />
                                <span className={`text-[10px] font-semibold tracking-wide ${isDropOver ? "text-red-300" : "text-neutral-400"}`}>
                                    SİL
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div key="panel-handle"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            >
                                <ChevronsLeft size={14} strokeWidth={2.5} className="text-neutral-500 opacity-60 hover:opacity-100 transition-opacity" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </DrawerTrigger>
        </div>
    );
});

LibraryTrigger.displayName = "LibraryTrigger";