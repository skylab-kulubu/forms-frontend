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
    <div className="flex flex-col p-4 lg:h-[calc(100dvh-3rem)] lg:overflow-hidden">
      <OverviewHeader formTitle={formTitle} formId={formId} formStatus={formInfo?.status} userRole={formInfo?.userRole}
        onEdit={() => router.push(`/admin/forms/${formId}/edit`)} onRefresh={onRefresh}
        onViewResponses={() => router.push(`/admin/forms/${formId}/responses`)}
      />

      <div className="grid grid-cols-1 gap-4 pt-4 lg:min-h-0 lg:flex-1 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7 lg:min-h-0">
          <FormPreview form={formData} />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5 lg:min-h-0">
          <FormMetrics formData={formData} metrics={metrics} isLoading={metricsLoading} />
        </div>
      </div>
    </div>
  );
}