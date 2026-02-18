"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "../../providers";
import { OverviewHeader } from "../Headers";
import FormPreview from "./components/FormPreview";
import FormMetrics from "./components/FormMetrics";

export default function FormOverview({ formId, formData, metrics, metricsLoading, onRefresh }) {
  const router = useRouter();
  const { form: formInfo } = useFormContext();

  const formTitle = formInfo?.title?.trim() || "--";

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden p-4">
      <OverviewHeader formTitle={formTitle} formId={formId} formStatus={formInfo?.status}
        onEdit={() => router.push(`/admin/forms/${formId}/edit`)} onRefresh={onRefresh}
        onViewResponses={() => router.push(`/admin/forms/${formId}/responses`)} 
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pt-4 lg:grid-cols-12">
        <div className="min-h-0 lg:col-span-7">
          <FormPreview form={formData} />
        </div>
        <div className="min-h-0 lg:col-span-5">
          <FormMetrics formData={formData} metrics={metrics} isLoading={metricsLoading}/>
        </div>
      </div>
    </div>
  );
}