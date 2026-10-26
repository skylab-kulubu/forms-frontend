"use client";

import { useParams, useSearchParams } from "next/navigation";
import ResponseDisplayer from "../../../../components/response-displayer/ResponseDisplayer";
import FormRoom from "../../../../components/form-room/FormRoom";
import { useResponsePreviewQuery } from "@/lib/hooks/useResponseShare";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";

function SharedResponse({ responseId, token }) {
  const { data, isLoading, error } = useResponsePreviewQuery(responseId, token);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      <FormStatusHandler isLoading={isLoading} error={error} data={data} variant="response"
        renderForm={(payload) => <ResponseDisplayer response={payload?.data ?? payload ?? null} token={token} />}
      />
    </div>
  );
}

export default function ResponsePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.responseId;
  const responseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const token = searchParams?.get("token") || null;

  return token ? <SharedResponse responseId={responseId} token={token} /> : <FormRoom />;
}
