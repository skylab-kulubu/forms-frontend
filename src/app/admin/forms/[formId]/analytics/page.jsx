"use client";

import { useParams, useRouter } from "next/navigation";
import { AnalyticsHeader } from "../../../components/Headers";
import FormAnalytics from "../../../components/form-analytics/FormAnalytics";
import { useFormAnalyticsQuery } from "@/lib/hooks/useFormAdmin";
import { useAttemptAnalyticsQuery } from "@/lib/hooks/useResponse";
import { useFormContext } from "../../../providers";

export default function AnalyticsPage() {
  const params = useParams();
  const formId = params?.formId;
  const router = useRouter();
  const { form } = useFormContext();
  const timed = (form?.timeLimitMinutes ?? 0) > 0;

  const { data, isLoading, error, refetch } = useFormAnalyticsQuery(formId);
  const attemptQuery = useAttemptAnalyticsQuery(formId, { enabled: Boolean(formId) && timed });
  const participation = timed ? attemptQuery.data?.data ?? null : null;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden p-4 lg:p-6">
      <AnalyticsHeader
        onOverview={() => router.push(`/admin/forms/${formId}`)}
        onRefresh={() => {
          refetch();
          if (timed) attemptQuery.refetch();
        }}
      />

      <FormAnalytics analytics={data?.data} participation={participation} isLoading={isLoading || (timed && attemptQuery.isLoading)} error={Boolean(error)} />
    </div>
  );
}
