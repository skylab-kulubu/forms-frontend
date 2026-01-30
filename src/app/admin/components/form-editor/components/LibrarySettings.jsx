import { AnimatePresence, motion } from "framer-motion";
import { LibrarySettingsEditors } from "./LibrarySettingsEditors";
import { LibrarySettingsLinkedForm } from "./LibrarySettingsLinkedForm";

const alertVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" },
    visible: { opacity: 1, height: "auto", marginTop: 12, marginBottom: 0, overflow: "hidden" },
    exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" }
};

export function LibrarySettings({ editors, onChangeEditorRole, handleAddEditor, handleRemoveEditor,
    setLinkedFormId, linkedFormId, status, setStatus, allowAnonymousResponses,
    setAllowAnonymousResponses, allowMultipleResponses, setAllowMultipleResponses, linkableForms, currentUserRole, isNewForm
}) {
    const canEditLinkedForm = currentUserRole === 3;

    return (
        <div className="flex flex-col divide-y divide-neutral-800/60 p-4 text-sm text-neutral-200">
            <LibrarySettingsEditors editors={editors} onChangeEditorRole={onChangeEditorRole}
                handleAddEditor={handleAddEditor} handleRemoveEditor={handleRemoveEditor} currentUserRole={currentUserRole}
            />

            {!isNewForm ? (
                <LibrarySettingsLinkedForm linkableForms={linkableForms ?? []} linkedFormId={linkedFormId}
                    setLinkedFormId={setLinkedFormId} allowAnonymousResponses={allowAnonymousResponses}
                    alertVariants={alertVariants} canEditLinkedForm={canEditLinkedForm}
                />
            ) : null}

            <section className="py-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-semibold text-neutral-100">Form durumu</p>
                        <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                            Formu yayından kaldırmadan önce geçici olarak duraklatabilir veya yeniden açabilirsiniz.
                        </p>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${status === 2 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-neutral-700 bg-neutral-900/60 text-neutral-400"}`}>
                        {status === 2 ? "Yayında" : "Duraklatıldı"}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Cevap kabulü</p>
                            <p className="text-[10px] text-neutral-500">Kapattığınızda kullanıcılar formu görebilir fakat gönderemez.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setStatus((prev) => (prev === 2 ? 1 : 2))} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${status === 2 ? "border-emerald-400/60 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}>
                                <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${status === 2 ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {status !== 2 && (
                            <motion.div key={"status-paused-alert"} variants={alertVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }}>
                                <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 shadow-sm mb-3">
                                    Form cevap kabulü duraklatıldı. Kullanıcılar formu görüntüleyebilir ancak yeni cevap gönderemezler.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Anonim cevap izni</p>
                            <p className="text-[10px] text-neutral-500">Kimlik bilgisi olmadan gönderime izin ver.</p>
                        </div>
                        <button type="button" onClick={() => setAllowAnonymousResponses((prev) => { const next = !prev; if (next) { setAllowMultipleResponses(true); if (linkedFormId) { setLinkedFormId(null, "anonymous-toggle") } } return next; })}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${allowAnonymousResponses ? "border-emerald-400/60 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}>
                            <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${allowAnonymousResponses ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    <div className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-opacity duration-300 ${allowAnonymousResponses ? "opacity-20" : ""}`}>
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Birden çok cevap izni</p>
                            <p className="text-[10px] text-neutral-500">Aynı kullanıcı yeniden gönderebilsin.</p>
                        </div>
                        <button type="button" disabled={allowAnonymousResponses} onClick={() => setAllowMultipleResponses((prev) => !prev)} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${allowMultipleResponses ? "border-emerald-400/60 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}>
                            <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${allowMultipleResponses ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
