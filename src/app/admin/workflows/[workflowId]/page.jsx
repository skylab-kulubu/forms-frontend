"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FileXCorner } from "lucide-react";
import WorkflowEditor from "../../components/workflow-editor/WorkflowEditor";
import WorkflowEditorSkeleton from "../../components/workflow-editor/components/WorkflowEditorSkeleton";
import StateCard from "@/app/components/StateCard";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";

export default function WorkflowEditorPage() {
  const params = useParams();
  const rawId = params?.workflowId;
  const workflowId = Array.isArray(rawId) ? rawId[0] : rawId;
  const initialFormId = useSearchParams().get("form");

  const { data, isLoading, error, refetch } = useWorkflowQuery(workflowId);
  const workflow = data?.data ?? data ?? null;

  if (isLoading) return <WorkflowEditorSkeleton />;

  if (error || !workflow) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col p-4">
        <StateCard title="Akış yüklenemedi" Icon={FileXCorner} description="Akış silinmiş olabilir ya da görüntüleme yetkiniz yok." />
      </div>
    );
  }

  return <WorkflowEditor workflow={workflow} onRefresh={refetch} initialFormId={initialFormId} />;
}
