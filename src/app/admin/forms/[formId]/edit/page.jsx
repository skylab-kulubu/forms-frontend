"use client";

import { useParams } from "next/navigation";
import { useFormQuery } from "@/lib/hooks/useFormAdmin";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import FormEditor from "../../../components/form-editor/FormEditor";

export default function FormEditorPage() {
  const { formId } = useParams();
  const { data, isLoading, error, refetch } = useFormQuery(formId);

  return (
    <FormStatusHandler
      isLoading={isLoading}
      error={error}
      data={data}
      renderForm={(data) => ( <FormEditor initialForm={data.data} onRefresh={refetch} /> )}
    />
  );
}
