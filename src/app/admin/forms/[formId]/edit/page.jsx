"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useFormQuery } from "@/lib/hooks/useFormAdmin";
import { useDraftQuery } from "@/lib/hooks/useDraft";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import SingleFormStudio from "../../../components/form-studio/SingleFormStudio";
import WorkflowStudio from "../../../components/form-studio/WorkflowStudio";
import StudioSkeleton from "../../../components/form-studio/StudioSkeleton";

function FormEditor() {
  const { formId } = useParams();
  const search = useSearchParams();
  const { data, isLoading: formLoading, error, refetch } = useFormQuery(formId);
  const { data: draftData, isLoading: draftLoading, error: draftError } = useDraftQuery(formId);

  const workflowId = data?.data?.workflow?.id ?? null;
  const { data: workflowData, isLoading: workflowLoading, isError: workflowError } = useWorkflowQuery(workflowId, { enabled: Boolean(workflowId) });
  const workflow = workflowData?.data ?? workflowData ?? null;

  const [flow, setFlow] = useState(null);
  if (!flow && workflowId && workflow && !workflowError) setFlow(workflow);

  if (flow) {
    const initialDraft = draftLoading ? undefined : draftData ? draftData.data ?? null : draftError?.status === 404 ? null : undefined;
    return <WorkflowStudio workflow={flow} initialFormId={formId} initialView={search.get("view") === "map" ? "map" : "page"} initialDraft={initialDraft} />;
  }

  if (workflowId && workflowLoading) return <StudioSkeleton />;

  return (
    <FormStatusHandler
      isLoading={formLoading || draftLoading} error={error} data={data}
      renderForm={(payload) => (
        <SingleFormStudio form={payload.data} draft={draftData?.data ?? null} onRefresh={refetch} />
      )}
    />
  );
}

export default function FormEditorPage() {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <FormEditor />
    </Suspense>
  );
}
