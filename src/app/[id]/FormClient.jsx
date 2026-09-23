"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDisplayFormQuery } from "@/lib/hooks/useForm";
import { useResponseDraftQuery } from "@/lib/hooks/useDraft";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import FormDisplayer from "@/app/components/form-displayer/FormDisplayer";

export default function FormClient() {
  const { id } = useParams();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const sessionLoading = status === "loading";

  const { data, isLoading, error } = useDisplayFormQuery(id);
  const displayedFormId = data?.data?.form?.id ?? null;
  const { data: draftData, isLoading: draftLoading } = useResponseDraftQuery(displayedFormId, isAuthed);

  return (
    <FormStatusHandler withBackground
      isLoading={sessionLoading || isLoading || (isAuthed && draftLoading)} error={error} data={data}
      renderForm={(responseData) => (
        <FormDisplayer form={responseData.data.form} stage={responseData.data.stage ?? 0} isWorkflow={responseData.data.state != null}
          startFormId={responseData.data.startFormId ?? null} draft={isAuthed ? (draftData?.data ?? null) : null}
        />
      )}
    />
  );
}