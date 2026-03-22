"use client";

import { useParams } from "next/navigation";
import { useFormQuery } from "@/lib/hooks/useFormAdmin";
import { useDraftQuery } from "@/lib/hooks/useDraft";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import FormEditor from "../../../components/form-editor/FormEditor";

export default function FormEditorPage() {
  const { formId } = useParams();
  const { data, isLoading: formLoading, error, refetch } = useFormQuery(formId);
  const { data: draftData, isLoading: draftLoading } = useDraftQuery(formId);

  return (
    <FormStatusHandler
      isLoading={formLoading || draftLoading} error={error} data={data}
      renderForm={(data) => (
        <FormEditor initialForm={data.data} draft={draftData?.data ?? null} onRefresh={refetch} />
      )}
    />
  );
}