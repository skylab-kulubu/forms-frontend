import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useFormEditor } from "../FormEditorContext";
import { REGISTRY } from "../../../../components/form-registry";
import { FormDisplayerHeader } from "../../../../components/form-displayer/components/FormDisplayerComponents";
import Background from "../../../../components/Background";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function FormPreview({ open, onClose }) {
    const { state } = useFormEditor();
    const { schema, title, description } = state;

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div key="form-preview-overlay" className="absolute inset-0 md:-left-8 z-50 flex flex-col bg-neutral-900"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ transform: "translateZ(0)" }}>
                        <Background />
                    </div>

                    <div className="relative z-20 flex h-8 shrink-0 items-center border-b rounded-b-xl border-white/10 bg-neutral-900 backdrop-blur-sm px-5">
                        <div className="flex-1" />
                        <span className="text-xs uppercase text-neutral-500 tracking-wide">Form Önizlemesi</span>
                        <div className="flex-1 flex justify-end">
                            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-200">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 overflow-y-auto scrollbar">
                        <div className="flex justify-center py-12 px-4 sm:px-6 pointer-events-none">
                            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/80 shadow-2xl">
                                <motion.div className="flex flex-col gap-6 p-6 sm:p-10" variants={containerVariants} initial="hidden" animate="show">
                                    <motion.div variants={itemVariants}>
                                        <FormDisplayerHeader title={title} description={description} />
                                    </motion.div>

                                    {schema.length > 0 ? (
                                        schema.map((field, index) => {
                                            const entry = REGISTRY[field.type];
                                            const DisplayComponent = entry?.Display;
                                            if (!DisplayComponent) return null;

                                            const hasCondition = !!field.condition?.fieldId;
                                            const isLast = index === schema.length - 1;

                                            return (
                                                <motion.div key={field.id} variants={itemVariants}
                                                    className={`relative ${hasCondition ? "opacity-40!" : ""} ${isLast ? "" : "border-b border-white/5 pb-6"}`}
                                                >
                                                    <DisplayComponent {...field.props} questionNumber={index + 1}/>
                                                </motion.div>
                                            );
                                        })
                                    ) : (
                                        <motion.div variants={itemVariants} className="flex min-h-[30vh] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-sm text-neutral-400">
                                            Bu formda gösterilecek soru yok.
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}