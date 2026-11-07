"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useFormContext } from "../../providers";
import { FormEditorProvider, useFormEditor } from "../form-editor/FormEditorContext";
import { EventReturnBar, HeaderStatusPill } from "../form-editor/components/EditorHeaderActions";
import { useDeleteFormMutation } from "@/lib/hooks/useFormAdmin";
import { saveDefinition, useCandidateFormsQuery, useCreateWorkflowMutation } from "@/lib/hooks/useWorkflowAdmin";
import { request } from "@/lib/apiClient";
import { studioApi } from "@/lib/studio/studio-api";
import { schemaOps } from "@/lib/studio/schema-ops";
import { FORM_STATUS_OPEN, cloneSchema, ensureEventIdentityFields, hasEventIdentity, pickTemplateGroup } from "@/lib/event-handoff";
import { editPathWithReturnTo, eventRefFromForm, returnToEventHref, sanitizeReturnTo } from "@/lib/return-to";
import ApprovalOverlay from "../ApprovalOverlay";
import FormShareDialog from "../share/FormShareDialog";
import { TRIGGER, autoLayout, slugifyNodeKey, toDefinitionPayload } from "../workflow-editor/workflow-graph";
import { StudioProvider, useStudio } from "./StudioContext";
import { StudioSessionProvider, usePresenceBroadcast, usePresenceMembers, useStudioSession } from "./StudioSession";
import { RemoteCursors, StudioPresenceProvider, colorOf, revealField, uniquePeople, useCursorBroadcast, useTypingField, whereOf } from "./StudioPresence";
import StudioLayout from "./StudioLayout";
import StudioPage from "./StudioPage";
import StudioPalette from "./StudioPalette";
import StudioHeaderActions from "./StudioHeaderActions";
import StudioFormPicker, { NEW_FORM } from "./StudioFormPicker";
import StudioSkeleton from "./StudioSkeleton";
import { SingleNextBlock } from "./StudioNextBlock";
import { OutlineHeader, OutlineQuestions } from "./StudioOutline";
import { Crumbs, FormInspectorBody, formCrumb, selectionCrumb } from "./StudioInspector";
import { FormKeys } from "./StudioKeys";
import { newFormDataOf, publishedQueries, studioStatusOf } from "./studio-save";

const emptySubscribe = () => () => {};

const readReturnTo = () => sanitizeReturnTo(new URLSearchParams(window.location.search).get("returnTo"));

const NO_MEMBERS = [];

function SingleStudioContent({ doc, legacyDraft, onRefresh, handoff, formEvent }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const studioSession = useStudioSession();
  const { setTitle: setGlobalTitle, setStatus: setGlobalStatus } = useFormContext();
  const { state } = useFormEditor();
  const { ui, actions: studio } = useStudio();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedFlash, setPublishedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [draftNotice, setDraftNotice] = useState(false);
  const [nextMenu, setNextMenu] = useState(null);

  const { mutate: deleteForm, isPending: isDeletePending } = useDeleteFormMutation();
  const createWorkflowMutation = useCreateWorkflowMutation();
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidateFormsQuery({ enabled: Boolean(nextMenu) });

  const isNewForm = !state.id;
  const rawReturnTo = useSyncExternalStore(emptySubscribe, () => new URLSearchParams(window.location.search).get("returnTo"), () => null);
  const returnTo = sanitizeReturnTo(rawReturnTo);
  const hasReturnTo = Boolean(returnTo) || Boolean(handoff?.eventId);
  const returnHref = state.id && returnTo ? returnToEventHref(returnTo, state.id) : null;
  const eventRef = eventRefFromForm({
    event: formEvent || { id: handoff?.eventId, name: handoff?.title },
    eventId: formEvent?.id || handoff?.eventId,
    eventName: formEvent?.name || handoff?.title,
  }, returnTo);
  const eventLinked = Boolean(handoff?.eventLinked || handoff?.eventId || eventRef?.id || hasEventIdentity(state.schema));

  const typingField = useTypingField();
  usePresenceBroadcast(studioSession, state.id, ui.selection, typingField);
  useCursorBroadcast(studioSession, state.id);
  const presenceByForm = usePresenceMembers(studioSession, [state.id]);
  const others = presenceByForm[state.id] ?? NO_MEMBERS;

  useEffect(() => {
    if (!eventLinked || !state.canEdit) return;
    const next = ensureEventIdentityFields(state.schema);
    const ops = schemaOps(state.schema, next);
    if (!state.allowAnonymousResponses) ops.push({ op: "set", path: ["allowAnonymousResponses"], value: true });
    if (ops.length === 0) return;
    if (state.id) doc.edit(ops, { record: false });
    else doc.seed({ schema: next, allowAnonymousResponses: true });
  }, [eventLinked, state.schema, state.allowAnonymousResponses, state.id, state.canEdit, doc]);

  useEffect(() => {
    if (state.revoked) onRefresh?.();
  }, [state.revoked, onRefresh]);

  useEffect(() => {
    if (!legacyDraft || !state.id) return;
    if (doc.adoptLegacyDraft(legacyDraft)) setDraftNotice(true);
    studioApi.deleteLegacyDraft(state.id);
  }, [legacyDraft, state.id, doc]);

  useEffect(() => {
    if (!draftNotice) return undefined;
    const timer = setTimeout(() => setDraftNotice(false), 4000);
    return () => clearTimeout(timer);
  }, [draftNotice]);

  useEffect(() => {
    if (state.id) return undefined;
    let cancelled = false;

    (async () => {
      if (handoff?.fromForm) {
        try {
          const payload = await request(`/api/admin/forms/${handoff.fromForm}`);
          const row = payload?.data ?? payload;
          const schema = cloneSchema(row?.schema);
          if (cancelled || !schema.length) return;
          doc.seed({ schema, status: handoff.open ? FORM_STATUS_OPEN : row?.status });
          setDraftNotice(true);
          return;
        } catch {}
      }
      if (!handoff?.ownerTeam) return;
      try {
        const groupsPayload = await request("/api/admin/forms/component-groups?PageSize=50");
        const match = pickTemplateGroup(groupsPayload?.data?.items ?? [], handoff.ownerTeam);
        if (cancelled || !match) return;
        doc.seed({ schema: cloneSchema(match.schema) });
        setDraftNotice(true);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [doc, state.id, handoff?.fromForm, handoff?.ownerTeam, handoff?.open]);

  useEffect(() => {
    setGlobalTitle(state.title);
    setGlobalStatus(state.status);
  }, [state.title, state.status, setGlobalTitle, setGlobalStatus]);

  useEffect(() => {
    if (!saveError) return undefined;
    const timer = setTimeout(() => setSaveError(null), 4000);
    return () => clearTimeout(timer);
  }, [saveError]);

  useEffect(() => {
    if (!state.pending) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.pending]);

  useEffect(() => {
    if (!publishedFlash) return undefined;
    const timer = setTimeout(() => setPublishedFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [publishedFlash]);

  const handleSave = useCallback(async () => {
    if (saving || !state.canEdit) return;
    setSaving(true);
    setSaveError(null);
    try {
      await doc.ensureCreated();
      const saved = await doc.publish();
      publishedQueries(queryClient, saved);
      setPublishedFlash(true);
      setDraftNotice(false);
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  }, [saving, state.canEdit, doc, queryClient]);

  const handleDiscardDraft = () => {
    setDraftNotice(false);
    if (doc.discard()) studio.toast("Taslak silindi. Ctrl+Z geri alır.");
  };

  const createFlow = async (choice) => {
    setNextMenu(null);
    try {
      let target = choice;
      if (choice === NEW_FORM) {
        const response = await request("/api/admin/forms", {
          method: "POST",
          body: {
            Id: null, Title: "Yeni Form", Description: "", Schema: [], Status: 2, AllowMultipleResponses: false, AllowAnonymousResponses: false,
            RequiresManualReview: false, Collaborators: [], Task: null, ClosesAt: null, TimeLimitMinutes: null,
          },
        });
        const created = response?.data ?? response ?? {};
        target = { id: created.id, title: created.title ?? "Yeni Form", requiresManualReview: false };
      }

      const reviewed = Boolean(state.requiresManualReview);
      const startKey = slugifyNodeKey(state.title, []);
      const targetKey = slugifyNodeKey(target.title, [startKey]);
      const nodes = [
        { nodeKey: startKey, formId: state.id, isStart: true, requiresManualReview: reviewed, position: null },
        { nodeKey: targetKey, formId: target.id, isStart: false, requiresManualReview: Boolean(target.requiresManualReview), position: null },
      ];
      const transitions = [{ localId: "t-start", sourceNodeKey: startKey, targetNodeKey: targetKey, trigger: reviewed ? TRIGGER.APPROVED : TRIGGER.SUBMITTED, priority: 0, condition: null }];
      const layout = autoLayout(nodes, transitions);
      const positioned = nodes.map((node) => ({ ...node, position: layout[node.nodeKey] }));

      const workflowResponse = await createWorkflowMutation.mutateAsync({ name: `${state.title || "Yeni Form"} akışı`, description: null, allowMultipleRuns: false });
      const workflowId = (workflowResponse?.data ?? workflowResponse)?.id;
      if (!workflowId) throw new Error("Akış oluşturulamadı");
      await saveDefinition({ workflowId, definition: toDefinitionPayload(positioned, transitions) });
      await onRefresh?.();
    } catch {
      studio.toast("Akış oluşturulamadı. Tekrar deneyin.", "red");
    }
  };

  const candidates = (() => {
    const payload = candidatesData?.data ?? candidatesData;
    return Array.isArray(payload) ? payload : payload?.items ?? [];
  })();

  const isWorkflowLocked = Boolean(state.workflow?.isPublished);
  const fields = state.schema;
  const crumb = selectionCrumb(ui.selection, fields);
  const crumbs = [
    { label: formCrumb(state), placeholder: !state.title?.trim(), onClick: () => studio.select({ kind: "none" }) },
    ...(ui.fill ? [{ label: "Doldurma" }] : crumb ? [{ label: crumb }] : []),
  ];

  const saveStatus = (
    <HeaderStatusPill {...studioStatusOf(state)} isSaving={saving} isFailed={Boolean(saveError)} publishedFlash={publishedFlash} />
  );

  const people = uniquePeople(others).map((member) => ({ ...member, where: whereOf(member, { fields }) }));
  const goToPerson = (person) => {
    const fieldId = person.selection?.[0];
    if (!fieldId || !revealField(fieldId, colorOf(person.userId))) studio.toast(`${person.name} bu formda, bir soru seçmemiş`);
  };

  const outline = (
    <>
      <OutlineHeader title={formCrumb(state)} untitled={!state.title?.trim()} inFlow={false} onOpenPalette={() => studio.setPalette(true)} />
      <OutlineQuestions eventLinked={eventLinked} onAdd={(anchor, index, options) => studio.openMenu({ anchor, index, ...options })} />
    </>
  );

  const nextBlock = state.workflow || fields.length === 0 ? null : (
    <SingleNextBlock reviewed={Boolean(state.requiresManualReview)}
      disabledReason={isNewForm ? "Önce formu kaydet; sonraki adım kayıtlı bir formla eklenir." : null}
      onAddStep={async (anchor) => setNextMenu({ anchor })}
    />
  );

  return (
    <StudioPresenceProvider members={others}>
    <StudioLayout
      top={<EventReturnBar returnHref={returnHref} pending={hasReturnTo && !returnHref} eventHref={eventRef?.href} eventName={eventRef?.name} />}
      outline={outline}
      center={(
        <>
          <StudioPage eventLinked={eventLinked} userName={session?.user?.fullName} nextBlock={nextBlock} onOverview={!isNewForm ? () => router.push(`/admin/forms/${state.id}`) : null} />
          <RemoteCursors session={studioSession} formId={state.id} members={others} />
        </>
      )}
      inspectorHeader={<Crumbs items={crumbs} />}
      inspector={<FormInspectorBody eventLinked={eventLinked} />}
      overlays={(
        <>
          <FormKeys eventLinked={eventLinked} onSave={handleSave} />
          <StudioHeaderActions saveStatus={saveStatus} returnHref={returnHref} people={people} onGoToPerson={goToPerson}
            fill={{ active: ui.fill, onToggle: studio.toggleFill }}
            onShare={!isNewForm ? () => setShareOpen(true) : null}
            draft={{ has: state.canEdit && state.dirty && !state.neverPublished, onDiscard: handleDiscardDraft, discarding: false }}
            onUndo={() => doc.undo()} canUndo={state.canUndo}
            onRedo={() => doc.redo()} canRedo={state.canRedo}
            secondary={!isNewForm ? {
              label: isWorkflowLocked ? "Yayındaki akışta kullanıldığı için silinemez" : "Formu sil",
              icon: Trash2,
              onClick: () => setDeleteOpen(true),
              disabled: isDeletePending || Number(state.userRole) !== 3 || isWorkflowLocked,
            } : null}
            onSave={state.canEdit ? handleSave : null} isSaving={saving} isError={Boolean(saveError)} error={saveError}
            draftNotice={draftNotice} onDraftNoticeClose={() => setDraftNotice(false)}
          />
          <AnimatePresence>
            {ui.palette ? (
              <StudioPalette key="palette" current={{ activeFormId: state.id, steps: state.id ? [{ formId: state.id, title: state.title, meta: "açık" }] : [] }}
                onPickStep={() => studio.setPalette(false)}
                onNavigate={(href) => { studio.setPalette(false); router.push(href); }}
                onClose={() => studio.setPalette(false)}
              />
            ) : null}
          </AnimatePresence>
          <AnimatePresence>
            {nextMenu ? (
              <StudioFormPicker key="next-picker" anchor={nextMenu.anchor} heading={`${state.requiresManualReview ? "Onaylanınca" : "Gönderilince"} hangi form açılsın?`}
                forms={candidates} isLoading={candidatesLoading} excludeIds={[state.id]} onPick={createFlow} onClose={() => setNextMenu(null)}
              />
            ) : null}
          </AnimatePresence>
          <ApprovalOverlay open={deleteOpen} preset="delete-form" context={{ isPending: isDeletePending }}
            onApprove={() => deleteForm(state.id, { onSuccess: () => router.push("/admin/forms"), onError: () => setDeleteOpen(false) })}
            onReject={() => setDeleteOpen(false)}
          />
          <FormShareDialog open={shareOpen} onClose={() => setShareOpen(false)} formId={state.id} formTitle={state.title} formStatus={state.status}
            allowAnonymous={state.allowAnonymousResponses} canEdit={Number(state.userRole) >= 2}
          />
        </>
      )}
    />
    </StudioPresenceProvider>
  );
}

function SingleStudioDoc({ snapshot, onRefresh, handoff }) {
  const studioSession = useStudioSession();
  const queryClient = useQueryClient();
  const { data: auth } = useSession();

  const [doc] = useState(() => {
    if (snapshot) return studioSession.open(snapshot);

    const created = studioSession.create(newFormDataOf(handoff), {
      onCreated: (next) => {
        window.history.replaceState(null, "", editPathWithReturnTo(next.id, readReturnTo()));
        queryClient.invalidateQueries({ queryKey: ["user-forms"] });
      },
    });
    if (auth?.user) {
      created.setTeam([{ user: { id: auth.user.id, fullName: auth.user.fullName, email: auth.user.email, profilePictureUrl: auth.user.profilePictureUrl }, role: 3 }]);
    }
    return created;
  });

  return (
    <FormEditorProvider doc={doc}>
      <SingleStudioContent doc={doc} legacyDraft={snapshot?.legacyDraft ?? null} onRefresh={onRefresh} handoff={handoff} formEvent={snapshot?.form?.event ?? null} />
    </FormEditorProvider>
  );
}

function SingleStudioSession(props) {
  const { actions: studio } = useStudio();

  return (
    <StudioSessionProvider onNotice={(text, tone) => studio.toast(text, tone === "red" ? "red" : undefined)} fallback={<StudioSkeleton />}>
      <SingleStudioDoc {...props} />
    </StudioSessionProvider>
  );
}

export default function SingleFormStudio({ snapshot = null, onRefresh, handoff = null }) {
  return (
    <StudioProvider initialFormId={snapshot?.form?.id ?? null}>
      <SingleStudioSession snapshot={snapshot} onRefresh={onRefresh} handoff={handoff} />
    </StudioProvider>
  );
}
