"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useFormContext } from "../../providers";
import { FormEditorProvider, hasDraftChanges, useFormEditor } from "../form-editor/FormEditorContext";
import { useDraftAutoSave } from "../form-editor/hooks/useDraftAutoSave";
import { EventReturnBar, HeaderStatusPill } from "../form-editor/components/EditorHeaderActions";
import { useDeleteFormMutation, useFormMutation } from "@/lib/hooks/useFormAdmin";
import { saveDefinition, useCandidateFormsQuery, useCreateWorkflowMutation } from "@/lib/hooks/useWorkflowAdmin";
import { request } from "@/lib/apiClient";
import {
  FORM_STATUS_OPEN, clearNewFormDraft, cloneSchema, ensureEventIdentityFields, hasEventIdentity, pickTemplateGroup, readNewFormDraft, writeNewFormDraft,
} from "@/lib/event-handoff";
import { editPathWithReturnTo, eventRefFromForm, returnToEventHref, sanitizeReturnTo } from "@/lib/return-to";
import ApprovalOverlay from "../ApprovalOverlay";
import FormShareDialog from "../share/FormShareDialog";
import { TRIGGER, autoLayout, slugifyNodeKey, toDefinitionPayload } from "../workflow-editor/workflow-graph";
import { StudioProvider, useStudio } from "./StudioContext";
import StudioLayout from "./StudioLayout";
import StudioPage from "./StudioPage";
import StudioPalette from "./StudioPalette";
import StudioHeaderActions from "./StudioHeaderActions";
import StudioFormPicker, { NEW_FORM } from "./StudioFormPicker";
import { SingleNextBlock } from "./StudioNextBlock";
import { OutlineHeader, OutlineQuestions } from "./StudioOutline";
import { Crumbs, FormInspectorBody, formCrumb, selectionCrumb } from "./StudioInspector";
import { FormKeys } from "./StudioKeys";
import { editorDataOf, formPayloadOf, newFormDataOf } from "./studio-save";

const emptySubscribe = () => () => {};

function SingleStudioContent({ isNewForm, draft, onRefresh, handoff, formEvent }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { setTitle: setGlobalTitle, setStatus: setGlobalStatus } = useFormContext();
  const { state, dispatch } = useFormEditor();
  const { ui, actions: studio } = useStudio();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [publishedFlash, setPublishedFlash] = useState(false);
  const [isDiscardingDraft, setIsDiscardingDraft] = useState(false);
  const [initialDraft] = useState(draft);
  const [draftNotice, setDraftNotice] = useState(Boolean(draft));
  const [nextMenu, setNextMenu] = useState(null);
  const storedDraftRef = useRef(false);

  const { mutate: saveForm, isPending, isError, isSuccess, error, reset } = useFormMutation();
  const { mutate: deleteForm, isPending: isDeletePending } = useDeleteFormMutation();
  const createWorkflowMutation = useCreateWorkflowMutation();
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidateFormsQuery({ enabled: Boolean(nextMenu) });
  const { hasServerDraft, syncStatus, draftSavedAt } = useDraftAutoSave(isNewForm ? null : state.id, state, Boolean(draft));
  const hasUnsavedDraft = hasDraftChanges(state);

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

  useEffect(() => {
    if (!eventLinked) return;
    const next = ensureEventIdentityFields(state.schema);
    if (JSON.stringify(next) !== JSON.stringify(state.schema)) dispatch({ type: "SET_SCHEMA", payload: next });
    if (!state.allowAnonymousResponses) dispatch({ type: "UPDATE_SETTINGS", payload: { key: "allowAnonymousResponses", value: true } });
  }, [eventLinked, state.schema, state.allowAnonymousResponses, dispatch]);

  useEffect(() => {
    if (!initialDraft) return undefined;
    const timer = setTimeout(() => setDraftNotice(false), 4000);
    return () => clearTimeout(timer);
  }, [initialDraft]);

  useEffect(() => {
    if (!isNewForm) return undefined;
    let cancelled = false;
    const storage = typeof sessionStorage === "undefined" ? null : sessionStorage;

    (async () => {
      const local = readNewFormDraft(storage, returnTo);
      if (local?.schema?.length) {
        if (cancelled) return;
        dispatch({ type: "LOAD_DRAFT", payload: local });
        setDraftNotice(true);
        return;
      }
      if (handoff?.fromForm) {
        try {
          const payload = await request(`/api/admin/forms/${handoff.fromForm}`);
          const row = payload?.data ?? payload;
          const schema = cloneSchema(row?.schema);
          if (cancelled || !schema.length) return;
          dispatch({ type: "LOAD_DRAFT", payload: { schema, status: handoff.open ? FORM_STATUS_OPEN : row?.status } });
          setDraftNotice(true);
          return;
        } catch {}
      }
      if (!handoff?.ownerTeam) return;
      try {
        const groupsPayload = await request("/api/admin/forms/component-groups?PageSize=50");
        const match = pickTemplateGroup(groupsPayload?.data?.items ?? [], handoff.ownerTeam);
        if (cancelled || !match) return;
        dispatch({ type: "SET_SCHEMA", payload: cloneSchema(match.schema) });
        setDraftNotice(true);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [isNewForm, returnTo, handoff?.fromForm, handoff?.ownerTeam, handoff?.open, dispatch]);

  useEffect(() => {
    if (!isNewForm || !returnTo) return;
    const storage = typeof sessionStorage === "undefined" ? null : sessionStorage;
    if (hasUnsavedDraft) {
      storedDraftRef.current = true;
      writeNewFormDraft(storage, returnTo, {
        title: state.title,
        description: state.description,
        schema: state.schema,
        status: state.status,
        allowAnonymousResponses: state.allowAnonymousResponses,
        allowMultipleResponses: state.allowMultipleResponses,
        requiresManualReview: state.requiresManualReview,
        task: state.task,
        closesAt: state.closesAt,
        timeLimitMinutes: state.timeLimitMinutes,
      });
    } else if (storedDraftRef.current) {
      storedDraftRef.current = false;
      clearNewFormDraft(storage, returnTo);
    }
  }, [
    isNewForm, returnTo, hasUnsavedDraft, state.title, state.description, state.schema, state.status, state.allowAnonymousResponses,
    state.allowMultipleResponses, state.requiresManualReview, state.task, state.closesAt, state.timeLimitMinutes,
  ]);

  useEffect(() => {
    setGlobalTitle(state.title);
    setGlobalStatus(state.status);
  }, [state.title, state.status, setGlobalTitle, setGlobalStatus]);

  useEffect(() => {
    if (isNewForm && state.editors.length === 0 && session?.user) {
      dispatch({
        type: "SET_EDITORS",
        payload: [{ user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email, profilePictureUrl: session.user.profilePictureUrl }, role: 3 }],
      });
    }
  }, [session, isNewForm, state.editors.length, dispatch]);

  useEffect(() => {
    if (!isError && !isSuccess) return undefined;
    const timer = setTimeout(() => reset(), 2000);
    return () => clearTimeout(timer);
  }, [isError, isSuccess, reset]);

  useEffect(() => {
    if (typeof window !== "undefined") window.getFormSchema = () => structuredClone(state.schema);
  }, [state.schema]);

  useEffect(() => {
    if (state.isSaved) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.isSaved]);

  useEffect(() => {
    if (!publishedFlash) return undefined;
    const timer = setTimeout(() => setPublishedFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [publishedFlash]);

  const handleSave = useCallback(() => {
    const savedState = state;
    saveForm({ id: state.id, payload: formPayloadOf(state, eventLinked), isUpdate: !isNewForm }, {
      onSuccess: (data) => {
        dispatch({ type: "MARK_SAVED", payload: savedState });
        setLastSavedAt(new Date());
        setPublishedFlash(true);
        setDraftNotice(false);
        if (isNewForm) {
          clearNewFormDraft(typeof sessionStorage === "undefined" ? null : sessionStorage, returnTo);
          const nextId = data?.data?.id ?? data?.id;
          if (nextId) router.push(editPathWithReturnTo(nextId, returnTo));
        }
      },
    });
  }, [state, saveForm, eventLinked, isNewForm, dispatch, returnTo, router]);

  const handleDiscardDraft = async () => {
    if (!state.id || !onRefresh) return;
    setIsDiscardingDraft(true);
    setDraftNotice(false);
    try {
      const result = await onRefresh();
      const refreshed = result?.data?.data ?? result?.data;
      if (refreshed) dispatch({ type: "LOAD_FORM", payload: refreshed });
    } finally {
      setIsDiscardingDraft(false);
    }
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
    <HeaderStatusPill dirty={!state.isSaved} draftSyncStatus={syncStatus} draftSavedAt={draftSavedAt} isSaving={isPending} isFailed={isError}
      lastSavedAt={lastSavedAt} publishedFlash={publishedFlash}
    />
  );

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
    <StudioLayout
      top={<EventReturnBar returnHref={returnHref} pending={hasReturnTo && !returnHref} eventHref={eventRef?.href} eventName={eventRef?.name} />}
      outline={outline}
      center={<StudioPage eventLinked={eventLinked} userName={session?.user?.fullName} nextBlock={nextBlock} />}
      inspectorHeader={<Crumbs items={crumbs} />}
      inspector={<FormInspectorBody eventLinked={eventLinked} />}
      overlays={(
        <>
          <FormKeys eventLinked={eventLinked} onSave={handleSave} />
          <StudioHeaderActions saveStatus={saveStatus} returnHref={returnHref}
            fill={{ active: ui.fill, onToggle: studio.toggleFill }}
            onShare={!isNewForm ? () => setShareOpen(true) : null}
            draft={{ has: hasServerDraft && hasUnsavedDraft, onDiscard: handleDiscardDraft, discarding: isDiscardingDraft }}
            onUndo={() => dispatch({ type: "UNDO" })} canUndo={state._history.length > 0}
            secondary={!isNewForm ? {
              label: isWorkflowLocked ? "Yayındaki akışta kullanıldığı için silinemez" : "Formu sil",
              icon: Trash2,
              onClick: () => setDeleteOpen(true),
              disabled: isDeletePending || Number(state.userRole) !== 3 || isWorkflowLocked,
            } : null}
            onSave={handleSave} isSaving={isPending} isError={isError} error={error}
            draftNotice={draftNotice && hasUnsavedDraft} onDraftNoticeClose={() => setDraftNotice(false)}
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
  );
}

export default function SingleFormStudio({ form = null, draft = null, onRefresh, handoff = null }) {
  return (
    <StudioProvider initialFormId={form?.id ?? null}>
      <FormEditorProvider initialData={form ? editorDataOf(form) : newFormDataOf(handoff)} initialDraft={draft}>
        <SingleStudioContent isNewForm={!form?.id} draft={draft} onRefresh={onRefresh} handoff={handoff} formEvent={form?.event ?? null} />
      </FormEditorProvider>
    </StudioProvider>
  );
}
