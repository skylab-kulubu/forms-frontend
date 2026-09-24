import { AnimatePresence, motion } from "framer-motion";
import { LibrarySettingsEditors } from "./LibrarySettingsEditors";
import { WorkflowLockMark, WorkflowManagedRow, WorkflowMembershipSection } from "./WorkflowMembership";
import { useFormEditor } from "../FormEditorContext";
import { WORKFLOW_INTAKE, effectiveFormSettings } from "@/lib/form-settings";
import { PANEL_SECTION, PANEL_STACK, PanelNotice, SectionHeader, ToggleRow } from "@/app/admin/components/utils/SidePanel";

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
        <div className={PANEL_STACK}>
            <LibrarySettingsEditors />

            {workflow ? <WorkflowMembershipSection workflow={workflow} /> : null}

            <section className={PANEL_SECTION}>
                <SectionHeader title="Form durumu" pill={isAccepting ? "Yayında" : "Duraklatıldı"} pillTone={isAccepting ? "skylab" : "neutral"}
                    description="Formu yayından kaldırmadan önce geçici olarak duraklatabilir veya yeniden açabilirsiniz."
                />

                <div className="space-y-3">
                    {isWorkflowLocked ? (
                        <WorkflowManagedRow title="Cevap kabulü" href={`/admin/workflows/${workflow.id}`}
                            description={workflow.isStart
                                ? `Akış yönetiyor · yeni başvurular ${intake === WORKFLOW_INTAKE.OPEN ? "açık" : "kapalı"}`
                                : `Akış yönetiyor · başvuru kabulü ${intake === WORKFLOW_INTAKE.CLOSED ? "kapalı" : "açık"}`}
                        />
                    ) : (
                        <ToggleRow title="Cevap kabulü" description="Kapattığınızda kullanıcılar formu görebilir fakat gönderemez."
                            checked={status === 2} onChange={() => dispatch({ type: "SET_STATUS", payload: status === 2 ? 1 : 2 })}
                        />
                    )}

                    <AnimatePresence>
                        {!isWorkflowLocked && status !== 2 && (
                            <motion.div key={"status-paused-alert"} variants={alertVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                                <PanelNotice className="mb-3">
                                    Form cevap kabulü duraklatıldı. Kullanıcılar formu görüntüleyebilir ancak yeni cevap gönderemezler.
                                </PanelNotice>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ToggleRow title="Anonim cevap izni" description="Kimlik bilgisi olmadan gönderime izin ver."
                        checked={allowAnonymousResponses} onChange={handleAnonymousToggle} disabled={isAnonymousLocked}
                        adornment={isAnonymousLocked ? <WorkflowLockMark /> : null}
                    />

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
                            <ToggleRow title="Birden çok cevap izni" description="Aynı kullanıcı yeniden gönderebilsin."
                                checked={allowMultipleResponses} dimmed={allowAnonymousResponses} disabled={allowAnonymousResponses}
                                onChange={() => dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowMultipleResponses", value: !allowMultipleResponses } })}
                            />
                            <ToggleRow title="Cevap kontrolü" description="Cevapların onaylanması için manuel eylem gerekli olsun."
                                checked={requiresManualReview} dimmed={allowAnonymousResponses} disabled={allowAnonymousResponses}
                                onChange={() => dispatch({ type: "UPDATE_SETTINGS", payload: { key: "requiresManualReview", value: !requiresManualReview } })}
                            />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
