"use client";

import { useParams } from "next/navigation";
import { useDisplayFormQuery } from "@/lib/hooks/useForm";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import FormDisplayer from "@/app/components/form-displayer/FormDisplayer";

export default function FormDisplayerPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useDisplayFormQuery(id);

  return (
    <FormStatusHandler
      isLoading={isLoading}
      error={error}
      data={data}
      renderForm={(responseData) => ( <FormDisplayer form={responseData.data.form} step={responseData.data.step}/> )}
    />
  );
}