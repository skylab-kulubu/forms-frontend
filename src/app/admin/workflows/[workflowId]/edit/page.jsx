"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FileXCorner } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";
import { startFormIdOf } from "@/lib/workflow-links";
import WorkflowStudio from "../../../components/form-studio/WorkflowStudio";
import StudioSkeleton from "../../../components/form-studio/StudioSkeleton";

function WorkflowEditRedirect() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const rawId = params?.workflowId;
  const workflowId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data, isLoading, error } = useWorkflowQuery(workflowId);
  const workflow = data?.data ?? data ?? null;
  const nodes = (workflow?.draft ?? workflow?.published)?.nodes ?? [];
  const requested = search.get("form");
  const target = requested && nodes.some((node) => node.formId === requested) ? requested : startFormIdOf(workflow);
  const view = search.get("view") === "map" ? "?view=map" : "";

  useEffect(() => {
    if (target) router.replace(`/admin/forms/${target}/edit${view}`);
  }, [target, view, router]);

  if (isLoading || target) return <StudioSkeleton />;

  if (error || !workflow) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col p-4">
        <StateCard title="Akış yüklenemedi" Icon={FileXCorner} description="Akış silinmiş olabilir ya da görüntüleme yetkiniz yok." />
      </div>
    );
  }

  return <WorkflowStudio workflow={workflow} initialView="map" />;
}

export default function WorkflowEditPage() {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <WorkflowEditRedirect />
    </Suspense>
  );
}
