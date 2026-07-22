"use client";

import { useParams, useRouter } from "next/navigation";
import { AnalyticsHeader } from "../../../components/Headers";
import FormAnalytics from "../../../components/form-analytics/FormAnalytics";
import { useFormAnalyticsQuery } from "@/lib/hooks/useFormAdmin";

export default function AnalyticsPage() {
  const params = useParams();
  const formId = params?.formId;
  const router = useRouter();

  const { data, isLoading, error, refetch } = useFormAnalyticsQuery(formId);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden p-4 lg:p-6">
      <AnalyticsHeader
        onOverview={() => router.push(`/admin/forms/${formId}`)}
        onRefresh={() => refetch()}
      />

      <FormAnalytics analytics={data?.data} isLoading={isLoading} error={Boolean(error)} />
    </div>
  );
}
