"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { LayoutTemplate, Trash2 } from "lucide-react";
import { createTemplateDoc } from "@/lib/studio/template-doc";
import { useDeleteGroupMutation, useGroupMutation } from "@/lib/hooks/useGroupAdmin";
import { useCreateGroupShareMutation } from "@/lib/hooks/useGroupShare";
import { useTemplateContext } from "../../providers";
import ApprovalOverlay from "../ApprovalOverlay";
import ShareOverlay from "../ShareOverlay";
import { FormEditorProvider, useFormEditor } from "../form-editor/FormEditorContext";
import { HeaderStatusPill } from "../form-editor/components/EditorHeaderActions";
import { StudioProvider, showsInspector, useStudio } from "../form-studio/StudioContext";
import { LocalStudioSession } from "../form-studio/StudioSession";
import StudioLayout from "../form-studio/StudioLayout";
import StudioPage from "../form-studio/StudioPage";
import StudioHeaderActions from "../form-studio/StudioHeaderActions";
import { OutlineHeader, OutlineQuestions } from "../form-studio/StudioOutline";
import { Crumbs, FormInspectorBody, selectionCrumbs } from "../form-studio/StudioInspector";
import { FormKeys } from "../form-studio/StudioKeys";
import { studioStatusOf } from "../form-studio/studio-save";
import { useFormActions } from "../form-studio/useFormActions";
import { scrollFieldIntoView } from "../form-studio/StudioPage";
import FormStart from "./FormStart";
import TemplatePalette from "./TemplatePalette";
import { useTemplateDraftAutoSave } from "./useTemplateDraftAutoSave";

const nameOf = (state) => state.title?.trim() || "Adsız şablon";

function TemplateContent({ doc, initialDraft }) {
  const router = useRouter();
  const { state } = useFormEditor();
  const { ui, actions: studio } = useStudio();
  const actions = useFormActions();
  const { setTitle: setTemplateTitle } = useTemplateContext();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [flash, setFlash] = useState(false);

  const { mutateAsync: saveGroup } = useGroupMutation();
  const { mutate: deleteGroup, isPending: isDeletePending } = useDeleteGroupMutation();
  const shareMutation = useCreateGroupShareMutation();

  const { syncStatus, draftSavedAt } = useTemplateDraftAutoSave(state, initialDraft);

  const name = nameOf(state);
  const inspectorOpen = showsInspector(ui, state.schema);

  useEffect(() => {
    if (!inspectorOpen && ui.sheet === "inspector") studio.setSheet(null);
  }, [inspectorOpen, ui.sheet, studio]);

  useEffect(() => {
    setTemplateTitle(name);
    return () => setTemplateTitle("");
  }, [name, setTemplateTitle]);

  useEffect(() => {
    if (!state.restored) return undefined;
    const timer = setTimeout(() => doc.clearRestored(), 4000);
    return () => clearTimeout(timer);
  }, [state.restored, doc]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (!saveError) return undefined;
    const timer = setTimeout(() => setSaveError(null), 4000);
    return () => clearTimeout(timer);
  }, [saveError]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const isNew = !doc.id;
    const sent = doc.getView();
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveGroup({ id: doc.id, isUpdate: !isNew, payload: doc.payload() });
      const saved = result?.data ?? result;
      doc.markSaved(saved, sent);
      setFlash(true);
      if (isNew && saved?.id) window.history.replaceState(null, "", `/admin/templates/${saved.id}`);
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  }, [saving, doc, saveGroup]);

  const importFields = (fields, formTitle) => {
    const ids = actions.insertFields(0, fields);
    if (ids.length === 0) return;
    studio.select({ kind: "fields", ids });
    studio.toast(`${formTitle || "Form"} formundan ${ids.length} bileşen alındı`);
    scrollFieldIntoView(ids[0]);
  };

  const crumbs = [
    { label: name, placeholder: !state.title?.trim(), onClick: () => studio.select({ kind: "none" }) },
    ...(ui.fill ? [{ label: "Doldurma" }] : selectionCrumbs(ui.selection, state.schema, studio.select)),
  ];

  const outline = (
    <>
      <OutlineHeader title={name} untitled={!state.title?.trim()} inFlow={false} icon={LayoutTemplate} switchTitle="Şablon aç (Ctrl+K)" onOpenPalette={() => studio.setPalette(true)} />
      <OutlineQuestions onAdd={(anchor, index, options) => studio.openMenu({ anchor, index, ...options })} />
    </>
  );

  return (
    <StudioLayout
      outline={outline}
      center={<StudioPage onOverview={() => router.push("/admin/templates")} start={(phone) => <FormStart phone={phone} onImport={importFields} />} />}
      inspectorHeader={<Crumbs items={crumbs} />}
      inspectorOpen={inspectorOpen}
      inspector={inspectorOpen ? <FormInspectorBody /> : null}
      overlays={(
        <>
          <FormKeys onSave={handleSave} />
          <StudioHeaderActions noun="Şablon" onSave={handleSave} isSaving={saving} isError={Boolean(saveError)} error={saveError}
            saveStatus={<HeaderStatusPill {...studioStatusOf(state)} draftSyncStatus={syncStatus} draftSavedAt={draftSavedAt} isSaving={saving} isFailed={Boolean(saveError)} publishedFlash={flash} flashLabel="Şablon kaydedildi" />}
            fill={{ active: ui.fill, onToggle: studio.toggleFill }}
            onShare={state.id ? () => setShareOpen(true) : null}
            draft={{ has: Boolean(state.id) && state.dirty, onDiscard: () => { if (doc.discard()) studio.toast("Taslak silindi. Ctrl+Z geri alır."); }, discarding: false }}
            draftNotice={state.restored} onDraftNoticeClose={() => doc.clearRestored()}
            onUndo={() => doc.undo()} canUndo={state.canUndo}
            onRedo={() => doc.redo()} canRedo={state.canRedo}
            secondary={state.id ? { label: "Şablonu sil", icon: Trash2, onClick: () => setDeleteOpen(true), disabled: isDeletePending } : null}
          />
          <AnimatePresence>
            {ui.palette ? (
              <TemplatePalette key="palette" currentId={state.id} name={name}
                onNavigate={(href) => { studio.setPalette(false); router.push(href); }}
                onClose={() => studio.setPalette(false)}
              />
            ) : null}
          </AnimatePresence>
          <ApprovalOverlay open={deleteOpen} preset="delete-group" context={{ isPending: isDeletePending }}
            onApprove={() => deleteGroup(state.id, { onSuccess: () => router.push("/admin/templates"), onError: () => setDeleteOpen(false) })}
            onReject={() => setDeleteOpen(false)}
          />
          <ShareOverlay open={shareOpen} onClose={() => setShareOpen(false)} resource="component-group" resourceId={state.id}
            title="Şablonu Paylaş" shareMutation={shareMutation}
            description="Bu bağlantıyla paylaşılan kişi şablonu görüntüleyip kendi şablonlarına ekleyebilir. Bağlantı 48 saat geçerlidir."
          />
        </>
      )}
    />
  );
}

function TemplateDoc({ initialGroup, initialDraft }) {
  const [doc] = useState(() => createTemplateDoc(initialGroup, initialDraft));

  return (
    <FormEditorProvider doc={doc}>
      <TemplateContent doc={doc} initialDraft={initialDraft} />
    </FormEditorProvider>
  );
}

export default function TemplateStudio({ initialGroup = null, initialDraft = null }) {
  return (
    <StudioProvider initialFormId={initialGroup?.id ?? null} template>
      <LocalStudioSession>
        <TemplateDoc initialGroup={initialGroup} initialDraft={initialDraft} />
      </LocalStudioSession>
    </StudioProvider>
  );
}
