"use client";

import { useParams, useRouter } from "next/navigation";
import { useFormContext } from "../../providers";
import { useFormQuery } from "@/lib/hooks/useFormAdmin";
import { useFormResponsesQuery } from "@/lib/hooks/useResponse";
import { OverviewHeader } from "../../components/Headers";
import FormPreview from "../../components/form-overview/FormPreview";
import FormMetrics from "../../components/form-overview/FormMetrics";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";


const PLACEHOLDER_STATS = { // TO DO
  dailyTrend: [
    { key: "d-1", label: "Pzt", count: 12 },
    { key: "d-2", label: "Sal", count: 1 },
    { key: "d-3", label: "Çar", count: 24 },
    { key: "d-4", label: "Per", count: 56 },
    { key: "d-5", label: "Cum", count: 67 },
    { key: "d-6", label: "Cmt", count: 89 },
    { key: "d-7", label: "Paz", count: 12 },
  ],
  hourlyTrend: [
    { key: "h-0", label: "00", count: 1 },
    { key: "h-2", label: "02", count: 2 },
    { key: "h-4", label: "04", count: 3 },
    { key: "h-6", label: "06", count: 6 },
    { key: "h-8", label: "08", count: 9 },
    { key: "h-10", label: "10", count: 5 },
    { key: "h-12", label: "12", count: 6 },
    { key: "h-14", label: "14", count: 9 },
    { key: "h-16", label: "16", count: 10 },
    { key: "h-18", label: "18", count: 1 },
    { key: "h-20", label: "20", count: 4 },
    { key: "h-22", label: "22", count: 2 },
  ],
  averageCompletionTime: null,
  sourceBreakdown: { registered: 0, anonymous: 0 },
};

export default function FormOverviewPage() {
  const params = useParams();
  const formId = params?.formId;
  const router = useRouter();

  const { form: formInfo } = useFormContext();

  const { data: formData, isLoading: formLoading, error: formError } = useFormQuery(formId);

  const { data: approvedData } = useFormResponsesQuery(formId, { status: 2 });
  const { data: rejectedData } = useFormResponsesQuery(formId, { status: 3 });
  const { data: recentData, refetch } = useFormResponsesQuery(formId, { page: 1, sortingDirection: "descending" });

  const totalResponses = formInfo?.responseCount ?? 0;
  const pendingCount = formInfo?.waitingResponses ?? 0;
  const approvedCount = approvedData?.data?.totalCount ?? 0;
  const rejectedCount = rejectedData?.data?.totalCount ?? 0;

  const formTitle = formInfo?.title?.trim() || "--";
  const metricsLoading = !formInfo && !approvedData && !rejectedData;

  return (
    <FormStatusHandler isLoading={formLoading} error={formError} variant="form" data={{ status: 0 }}
      renderForm={() => (
        <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden p-4">
          <OverviewHeader formTitle={formTitle} formId={formId} formStatus={formInfo?.status}
            onEdit={() => router.push(`/admin/forms/${formId}/edit`)}
            onViewResponses={() => router.push(`/admin/forms/${formId}/responses`)} onRefresh={() => refetch()}
          />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pt-4 lg:grid-cols-12">
            <div className="min-h-0 lg:col-span-7">
              <FormPreview form={formData} />
            </div>
            <div className="min-h-0 lg:col-span-5">
              <FormMetrics formData={formData} formId={formId} placeholderStats={PLACEHOLDER_STATS} isLoading={metricsLoading}
                stats={{ totalResponses, pendingCount, approvedCount, rejectedCount }}
              />
            </div>
          </div>
        </div>
      )}
    />
  );
}