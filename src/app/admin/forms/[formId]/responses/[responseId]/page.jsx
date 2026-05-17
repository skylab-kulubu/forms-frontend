"use client";

import { useParams, useSearchParams } from "next/navigation";
import ResponseDisplayer from "../../../../components/response-displayer/ResponseDisplayer";
import { useResponsePreviewQuery } from "@/lib/hooks/useResponseShare";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";

export default function ResponsePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.responseId;
  const responseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const token = searchParams?.get("token") || null;
  const { data, isLoading, error } = useResponsePreviewQuery(responseId, token);

  return (
    <div className="px-6 pb-6">
      <FormStatusHandler isLoading={isLoading} error={error} data={data} variant="response"
        renderForm={(responseData) => (
          <ResponseDisplayer response={responseData?.data ?? responseData ?? null} token={token} />
        )}
      />
    </div>
  );
}
