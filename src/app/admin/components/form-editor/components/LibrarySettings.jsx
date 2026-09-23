import { AnimatePresence, motion } from "framer-motion";
import { LibrarySettingsEditors } from "./LibrarySettingsEditors";
import { WorkflowLockMark, WorkflowManagedRow, WorkflowMembershipSection } from "./WorkflowMembership";
import { useFormEditor } from "../FormEditorContext";
import { WORKFLOW_INTAKE, effectiveFormSettings } from "@/lib/form-settings";

const alertVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" },
    visible: { opacity: 1, height: "auto", marginTop: 12, marginBottom: 0, overflow: "hidden" },
    exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" }
};

export function LibrarySettings() {
    const { state, dispatch } = useFormEditor();
    const { id: formId, status, allowAnonymousResponses, allowMultipleResponses, requiresManualReview, workflow } = state;

    const isWorkflowLocked = Boolean(workflow?.isPublished);
    const isAnonymousLocked = isWorkflowLocked && !allowAnonymousResponses;
    const isAccepting = effectiveFormSettings(state).isOpen;
    const intake = Number(workflow?.intake ?? WORKFLOW_INTAKE.OPEN);

    const handleAnonymousToggle = () => {
        const nextValue = !allowAnonymousResponses;
        dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowAnonymousResponses", value: nextValue } });
        if (nextValue) {
            dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowMultipleResponses", value: true } });
        }
    };

    return (
        <div className="flex flex-col divide-y divide-neutral-800/60 p-4 text-sm text-neutral-200">
            <LibrarySettingsEditors />

            {workflow ? <WorkflowMembershipSection workflow={workflow} /> : null}

            <section className="py-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-semibold text-neutral-100">Form durumu</p>
                        <p className="mt-1 text-2xs text-neutral-500 leading-relaxed">Formu yayından kaldırmadan önce geçici olarak duraklatabilir veya yeniden açabilirsiniz.</p>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-3xs font-semibold uppercase tracking-[0.18em] ${isAccepting ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-neutral-700 bg-neutral-900/60 text-neutral-400"}`}>
                        {isAccepting ? "Yayında" : "Duraklatıldı"}
                    </span>
                </div>

                <div className="space-y-3">
                    {isWorkflowLocked ? (
                        <WorkflowManagedRow title="Cevap kabulü" href={`/admin/workflows/${workflow.id}`}
                            description={workflow.isStart
                                ? `Akış yönetiyor · yeni başvurular ${intake === WORKFLOW_INTAKE.OPEN ? "açık" : "kapalı"}`
                                : `Akış yönetiyor · başvuru kabulü ${intake === WORKFLOW_INTAKE.CLOSED ? "kapalı" : "açık"}`}
                        />
                    ) : (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                            <div>
                                <p className="text-sm font-semibold text-neutral-100">Cevap kabulü</p>
                                <p className="text-3xs text-neutral-500">Kapattığınızda kullanıcılar formu görebilir fakat gönderemez.</p>
                            </div>
                            <button type="button" onClick={() => dispatch({ type: "SET_STATUS", payload: status === 2 ? 1 : 2 })} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${status === 2 ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"}`}>
                                <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${status === 2 ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    )}

                    <AnimatePresence>
                        {!isWorkflowLocked && status !== 2 && (
                            <motion.div key={"status-paused-alert"} variants={alertVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                                <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 shadow-sm mb-3">
                                    Form cevap kabulü duraklatıldı. Kullanıcılar formu görüntüleyebilir ancak yeni cevap gönderemezler.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Anonim cevap izni</p>
                            <p className="text-3xs text-neutral-500">Kimlik bilgisi olmadan gönderime izin ver.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isAnonymousLocked ? <WorkflowLockMark /> : null}
                            <button type="button" disabled={isAnonymousLocked} onClick={handleAnonymousToggle} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition disabled:cursor-not-allowed disabled:opacity-50 ${allowAnonymousResponses ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"}`}>
                                <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${allowAnonymousResponses ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    </div>

                    {isWorkflowLocked ? (
                        <>
                            <WorkflowManagedRow title="Birden çok cevap izni" href={`/admin/workflows/${workflow.id}`}
                                description={typeof workflow.allowMultipleRuns === "boolean"
                                    ? `Akış yönetiyor · tekrar başlatma ${workflow.allowMultipleRuns ? "açık" : "kapalı"}`
                                    : "Akış yönetiyor · akıştaki tekrar başlatma ayarı geçerli"}
                            />
                            <WorkflowManagedRow title="Cevap kontrolü" href={`/admin/workflows/${workflow.id}?form=${formId}`}
                                description={`Akış yönetiyor · bu adımda manuel onay ${(workflow.requiresManualReview ?? requiresManualReview) ? "açık" : "kapalı"}`}
                            />
                        </>
                    ) : (
                        <>
                            <div className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-opacity duration-300 ${allowAnonymousResponses ? "opacity-20" : ""}`}>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-100">Birden çok cevap izni</p>
                                    <p className="text-3xs text-neutral-500">Aynı kullanıcı yeniden gönderebilsin.</p>
                                </div>
                                <button type="button" disabled={allowAnonymousResponses} onClick={() => dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowMultipleResponses", value: !allowMultipleResponses } })} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${allowMultipleResponses ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"}`}>
                                    <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${allowMultipleResponses ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                            <div className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-opacity duration-300 ${allowAnonymousResponses ? "opacity-20" : ""}`}>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-100">Cevap kontrolü</p>
                                    <p className="text-3xs text-neutral-500">Cevapların onaylanması için manuel eylem gerekli olsun.</p>
                                </div>
                                <button type="button" disabled={allowAnonymousResponses} onClick={() => dispatch({ type: "UPDATE_SETTINGS", payload: { key: "requiresManualReview", value: !requiresManualReview } })} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition disabled:cursor-not-allowed ${requiresManualReview ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"}`}>
                                    <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${requiresManualReview ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}