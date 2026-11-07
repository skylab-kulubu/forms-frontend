"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/apiClient";
import { studioSnapshotPath } from "@/lib/studio/studio-api";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import SingleFormStudio from "../../../components/form-studio/SingleFormStudio";
import WorkflowStudio from "../../../components/form-studio/WorkflowStudio";
import StudioSkeleton from "../../../components/form-studio/StudioSkeleton";

function FormEditor() {
  const { formId } = useParams();
  const search = useSearchParams();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["studio-snapshot", formId],
    queryFn: () => request(studioSnapshotPath(formId)),
    enabled: Boolean(formId),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const snapshot = data?.data ?? null;
  const workflowId = snapshot?.form?.workflow?.id ?? null;
  const { data: workflowData, isLoading: workflowLoading, isError: workflowError } = useWorkflowQuery(workflowId, { enabled: Boolean(workflowId) });
  const workflow = workflowData?.data ?? workflowData ?? null;

  const [flow, setFlow] = useState(null);
  if (!flow && workflowId && workflow && !workflowError) setFlow(workflow);

  if (flow) {
    return <WorkflowStudio workflow={flow} initialFormId={formId} initialView={search.get("view") === "map" ? "map" : "page"} seed={snapshot} />;
  }

  if (workflowId && workflowLoading) return <StudioSkeleton />;

  return (
    <FormStatusHandler
      isLoading={isLoading} error={error} data={data}
      renderForm={(payload) => (
        <SingleFormStudio snapshot={payload.data} onRefresh={refetch} />
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
