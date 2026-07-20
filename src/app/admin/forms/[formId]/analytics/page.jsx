"use client";

import { useParams, useRouter } from "next/navigation";
import { AnalyticsHeader } from "../../../components/Headers";
import FormAnalytics from "../../../components/form-analytics/FormAnalytics";
import { useFormAnalyticsQuery } from "@/lib/hooks/useFormAdmin";
import { useFormContext } from "../../../providers";

export default function AnalyticsPage() {
  const params = useParams();
  const formId = params?.formId;
  const router = useRouter();

  const { form: formInfo } = useFormContext();
  const { data, isLoading, error, refetch } = useFormAnalyticsQuery(formId);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden p-4 lg:p-6">
      <AnalyticsHeader userRole={formInfo?.userRole}
        onOverview={() => router.push(`/admin/forms/${formId}`)}
        onViewResponses={() => router.push(`/admin/forms/${formId}/responses`)}
        onEdit={() => router.push(`/admin/forms/${formId}/edit`)}
        onRefresh={() => refetch()}
      />

      <FormAnalytics analytics={data?.data} isLoading={isLoading} error={Boolean(error)} />
    </div>
  );
}
