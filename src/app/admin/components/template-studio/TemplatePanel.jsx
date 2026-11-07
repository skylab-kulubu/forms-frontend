"use client";

import { PANEL_SECTION, PANEL_STACK, PanelTextarea, SectionHeader } from "@/app/admin/components/utils/SidePanel";
import { useFormEditor } from "../form-editor/FormEditorContext";
import { useFormActions } from "../form-studio/useFormActions";

export default function TemplatePanel() {
  const { state } = useFormEditor();
  const actions = useFormActions();

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Açıklama" description="Şablonlar listesinde ve paylaşım sayfasında görünür, başvuran görmez." />
        <PanelTextarea rows={3} value={state.description ?? ""} aria-label="Şablon açıklaması" placeholder="Bu şablon ne için kullanılıyor?"
          onChange={(event) => actions.setDescription(event.target.value)}
        />
      </section>

      <section className={PANEL_SECTION}>
        <SectionHeader title="Kullanım"
          description="Forma eklenince sorular kopyalanır. Buradaki değişiklikler sonraki eklemelerde geçerli olur, daha önce eklenmiş formlar değişmez."
        />
      </section>
    </div>
  );
}
