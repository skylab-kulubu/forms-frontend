"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "../../providers";
import { OverviewHeader } from "../Headers";
import FormShareDialog from "../share/FormShareDialog";
import FormPreview from "./components/FormPreview";
import FormMetrics from "./components/FormMetrics";
import { effectiveFormSettings } from "@/lib/form-settings";

export default function FormOverview({ formId, formData, metrics, metricsLoading, onRefresh }) {
  const router = useRouter();
  const { form: formInfo } = useFormContext();
  const [shareOpen, setShareOpen] = useState(false);
  const form = formData?.data ?? formData;
  const settings = effectiveFormSettings(form);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden p-4 lg:p-6">
      <OverviewHeader formStatus={formInfo?.status} userRole={formInfo?.userRole}
        onEdit={() => router.push(`/admin/forms/${formId}/edit`)} onRefresh={onRefresh}
        onViewResponses={() => router.push(`/admin/forms/${formId}/responses`)}
        onAnalytics={() => router.push(`/admin/forms/${formId}/analytics`)}
        onShare={() => setShareOpen(true)}
      />

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar lg:overflow-hidden lg:pr-0">
        <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-7 lg:min-h-0">
            <FormPreview form={formData} />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5 lg:min-h-0">
            <FormMetrics formData={formData} metrics={metrics} isLoading={metricsLoading} />
          </div>
        </div>
      </div>

      <FormShareDialog open={shareOpen} onClose={() => setShareOpen(false)}
        formId={formId} formTitle={form?.title} formStatus={settings.isOpen ? 2 : 1}
        allowAnonymous={settings.allowAnonymousResponses}
        canEdit={Number(formInfo?.userRole) >= 2}
      />
    </div>
  );
}
