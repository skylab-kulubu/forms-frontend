"use client";

import { useParams } from "next/navigation";
import { FileXCorner } from "lucide-react";
import WorkflowEditor from "../../components/workflow-editor/WorkflowEditor";
import StateCard from "@/app/components/StateCard";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";

function EditorSkeleton() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-11 flex h-[calc(100dvh-5.5rem)] flex-col gap-2 p-2 lg:col-span-8">
          <div className="shimmer mx-auto h-8 w-full max-w-3xl rounded-md" />
          <div className="shimmer min-h-0 flex-1 rounded-xl" />
        </div>
        <div className="hidden h-[calc(100dvh-5.5rem)] max-w-xl flex-col gap-2 p-2 lg:col-span-4 lg:flex">
          <div className="shimmer h-8 w-40 rounded-md" />
          <div className="shimmer h-24 rounded-lg" />
          <div className="shimmer h-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function WorkflowEditorPage() {
  const params = useParams();
  const rawId = params?.workflowId;
  const workflowId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data, isLoading, error, refetch } = useWorkflowQuery(workflowId);
  const workflow = data?.data ?? data ?? null;

  if (isLoading) return <EditorSkeleton />;

  if (error || !workflow) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col p-4">
        <StateCard title="Akış yüklenemedi" Icon={FileXCorner} description="Akış silinmiş olabilir ya da görüntüleme yetkiniz yok." />
      </div>
    );
  }

  return <WorkflowEditor workflow={workflow} onRefresh={refetch} />;
}
