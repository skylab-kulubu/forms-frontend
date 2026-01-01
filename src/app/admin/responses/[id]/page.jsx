"use client";

import { useParams } from "next/navigation";
import ResponseDisplayer from "../components/response-displayer/ResponseDisplayer";
import { useResponseQuery } from "@/lib/hooks/useResponse";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";

export default function ResponsePage() {
  const params = useParams();
  const rawId = params?.id;
  const responseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data, isLoading, error } = useResponseQuery(responseId);

  return (
    <div className="p-6">
      <FormStatusHandler isLoading={isLoading} error={error} data={data} variant="response"
        renderForm={(responseData) => ( <ResponseDisplayer response={responseData?.data ?? responseData ?? null} />)}
      />
    </div>
  );
}