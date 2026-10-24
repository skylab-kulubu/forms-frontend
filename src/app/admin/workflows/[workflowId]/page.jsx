"use client";

import { useParams } from "next/navigation";
import { FileXCorner } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";
import WorkflowFlowPage from "../../components/workflow-page/WorkflowFlowPage";

function FlowPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6" aria-busy="true">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="shimmer h-28 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-2 lg:col-span-8">{Array.from({ length: 6 }, (_, index) => <div key={index} className="shimmer h-12 rounded-lg" />)}</div>
        <div className="col-span-12 space-y-3 lg:col-span-4">{Array.from({ length: 3 }, (_, index) => <div key={index} className="shimmer h-16 rounded-lg" />)}</div>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const params = useParams();
  const rawId = params?.workflowId;
  const workflowId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data, isLoading, error } = useWorkflowQuery(workflowId);
  const workflow = data?.data ?? data ?? null;

  if (isLoading) return <FlowPageSkeleton />;

  if (error || !workflow) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col p-4">
        <StateCard title="Akış yüklenemedi" Icon={FileXCorner} description="Akış silinmiş olabilir ya da görüntüleme yetkiniz yok." />
      </div>
    );
  }

  return <WorkflowFlowPage workflow={workflow} />;
}
