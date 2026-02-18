"use client";

import { useParams } from "next/navigation";
import { useFormQuery, useFormMetricsQuery } from "@/lib/hooks/useFormAdmin";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import FormOverview from "../../components/form-overview/FormOverview";

export default function FormOverviewPage() {
  const params = useParams();
  const formId = params?.formId;

  const { data: formData, isLoading: formLoading, error: formError } = useFormQuery(formId);

  const { data: metricsData, isLoading: metricsLoading } = useFormMetricsQuery(formId);

  const handleRefresh = () => { refetchForm(); refetchMetrics(); };

  return (
    <FormStatusHandler isLoading={formLoading} error={formError} variant="form" data={{ status: 0 }}
      renderForm={() => (<FormOverview formId={formId} formData={formData} metrics={metricsData?.data} metricsLoading={metricsLoading} onRefresh={handleRefresh} />)}
    />
  );
}