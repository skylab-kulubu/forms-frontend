import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsUpDown, X } from "lucide-react";
import SearchPicker from "../../../../components/utils/SearchPicker";

const alertVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" },
    visible: { opacity: 1, height: "auto", marginTop: 12, marginBottom: 0, overflow: "hidden" },
    exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" }
};

export function LibrarySettingsLinkedForm({ linkedFormId, setLinkedFormId, linkableForms = [], allowAnonymousResponses, alertVariants: alertVariantsProp, canEditLinkedForm = true }) {
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [formSearch, setFormSearch] = useState("");
    const formPickerRef = useRef(null);
    const variants = alertVariantsProp || alertVariants;
    const forms = Array.isArray(linkableForms) ? linkableForms : [];

    const linkedForm = forms.find((form) => form.id === linkedFormId) ?? null;

    useEffect(() => {
        if (!showFormPicker) return;
        const handleClick = (event) => {
            if (formPickerRef.current && !formPickerRef.current.contains(event.target)) {
                setShowFormPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showFormPicker]);

    const filteredForms = useMemo(() => {
        const q = formSearch.trim().toLowerCase();
        if (!q) return forms;
        return forms.filter((form) => form.title.toLowerCase().includes(q));
    }, [formSearch, forms]);

    const chooseForm = (formId) => {
        setLinkedFormId && setLinkedFormId(formId);
        setShowFormPicker(false);
        setFormSearch("");
    };

    const clearForm = () => {
        setLinkedFormId && setLinkedFormId("");
        setShowFormPicker(false);
        setFormSearch("");
    };

    if (!canEditLinkedForm) {
        return (
            <section className="py-6 space-y-4 relative">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-semibold text-neutral-100">Bağlı form</p>
                        <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                            Bu formun bağlı olduğu hedefi görüntüleyebilirsiniz.
                        </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        Görüntüleme
                    </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-neutral-900/40 px-4 py-3 text-xs text-neutral-200">
                    {linkedForm || linkedFormId ? (
                        <div className="space-y-1">
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Bağlı</p>
                            <p className="text-sm font-semibold text-neutral-50">{linkedForm?.title || "Bağlı form"}</p>
                            <p className="text-[10px] text-neutral-500">{linkedFormId || linkedForm?.id}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Bağlı değil</p>
                            <p className="text-sm font-semibold text-neutral-50">Bu form için bağlantı yok.</p>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="py-6 space-y-4 relative">
            <div className={`flex items-start justify-between gap-4 transition-opacity duration-300 ${allowAnonymousResponses ? "opacity-20" : ""}`}>
                <div>
                    <p className="font-semibold text-neutral-100">Başka bir form ile bağla</p>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                        Bir sonraki formun ne zaman açılacağını kontrol etmek için bağımlılık kurun.
                    </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    Opsiyonel
                </span>
            </div>

            <div className={`space-y-3 transition-opacity duration-300 ${allowAnonymousResponses ? "opacity-20" : ""}`}>
                <label className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Hedef form</label>
                <div className="relative" ref={formPickerRef}>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            <ChevronsUpDown size={14} />
                        </span>
                        <button type="button" aria-haspopup="dialog" aria-expanded={showFormPicker} onClick={() => !allowAnonymousResponses && setShowFormPicker((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-neutral-900/60 pl-9 pr-3 py-2 text-left text-sm text-neutral-100 shadow-sm outline-none transition hover:bg-white/5 focus:border-white/25 focus:ring-2 focus:ring-white/15"
                        >
                            <span className={linkedForm ? "text-neutral-100" : "text-neutral-500"}>
                                {linkedForm ? linkedForm.title : "Bağlantı seçin"}
                            </span>
                            {linkedForm && (
                                <span onClick={(event) => { event.stopPropagation(); clearForm(); }} className="ml-2 text-neutral-500 transition-colors hover:text-neutral-200">
                                    <X size={14} />
                                </span>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFormPicker ? (
                            <SearchPicker searchValue={formSearch} onSearchChange={setFormSearch} autoFocus
                                items={filteredForms} itemsPerPage={4} activeItemId={linkedForm?.id} getItemId={(form) => form.id}
                                onSelect={(form) => chooseForm(form.id)} footerText="Bu form tamamlandığında seçilen forma geçilir."
                                showClear={Boolean(linkedForm)} onClear={clearForm}
                                renderItem={(form, { active, onSelect }) => (
                                    <button type="button" onClick={onSelect} className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-white/10 ${active ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
                                    >
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                                        <div className="flex-1">
                                            <p className="font-medium leading-tight">{form.title}</p>
                                            <p className="text-[11px] text-neutral-500">{form.id}</p>
                                        </div>
                                    </button>
                                )}
                            />
                        ) : null}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {linkedForm && (
                        <motion.div key={"linked-form-alert"} variants={variants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }}>
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                                <span>{linkedForm.title} ile eşleştirildi.</span>
                                <button type="button" className="text-emerald-100/80 transition-colors hover:text-emerald-50" onClick={clearForm}>
                                    Kaldır
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${allowAnonymousResponses ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <span className="px-3 py-1.5 rounded-full border border-white/10 bg-neutral-900/80 text-[11px] font-medium text-neutral-200">
                    Anonim cevap açık olduğundan kapalıdır
                </span>
            </div>
        </section>
    );
}