"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ResponseDisplayer from "../../../../components/response-displayer/ResponseDisplayer";
import { useResponsePreviewQuery } from "@/lib/hooks/useResponseShare";
import { useAttemptQuery } from "@/lib/hooks/useResponse";
import { ATTEMPT_STATUS } from "@/lib/attempt-status";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";

export default function ResponsePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params?.responseId;
  const responseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const formId = params?.formId;
  const token = searchParams?.get("token") || null;
  const isAttempt = searchParams?.get("attempt") === "1";

  const responseQuery = useResponsePreviewQuery(responseId, token, { enabled: !isAttempt });
  const attemptQuery = useAttemptQuery(responseId, { enabled: isAttempt });
  const { data, isLoading, error } = isAttempt ? attemptQuery : responseQuery;

  const attemptView = isAttempt ? data?.data ?? null : null;
  const attemptStatus = attemptView?.attempt?.status;
  const linkedResponseId = attemptStatus === ATTEMPT_STATUS.SUBMITTED || attemptStatus === ATTEMPT_STATUS.PROVISIONAL
    ? attemptView.attempt.responseId ?? null
    : null;

  useEffect(() => {
    if (linkedResponseId) router.replace(`/admin/forms/${attemptView?.formId ?? formId}/responses/${linkedResponseId}`);
  }, [linkedResponseId, attemptView?.formId, formId, router]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      <FormStatusHandler isLoading={isLoading || Boolean(linkedResponseId)} error={error} data={data} variant="response"
        renderForm={(payload) => isAttempt ? (
          <ResponseDisplayer attemptView={payload?.data ?? null} />
        ) : (
          <ResponseDisplayer response={payload?.data ?? payload ?? null} token={token} />
        )}
      />
    </div>
  );
}
