"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDisplayFormQuery } from "@/lib/hooks/useForm";
import { useResponseDraftQuery } from "@/lib/hooks/useDraft";
import { captureAttribution } from "@/lib/attribution";
import { FormStatusHandler, WORKFLOW_STATE } from "@/app/components/FormStatusHandler";
import FormDisplayer from "@/app/components/form-displayer/FormDisplayer";
import StatusScreen from "@/app/components/form-displayer/components/StatusScreen";
import FormSkeleton from "@/app/components/form-displayer/components/FormSkeleton";

const LAST_RUN_SCREEN = {
  [WORKFLOW_STATE.COMPLETED]: "fullyCompleted",
  [WORKFLOW_STATE.DECLINED]: "declined",
};

export default function FormClient() {
  const { id } = useParams();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const sessionLoading = status === "loading";
  const [rerunFormId, setRerunFormId] = useState(null);

  const { data, isLoading, error } = useDisplayFormQuery(id);
  const displayedFormId = data?.data?.form?.id ?? null;
  const { data: draftData, isLoading: draftLoading } = useResponseDraftQuery(displayedFormId, isAuthed);

  useEffect(() => {
    captureAttribution(id, window.location.search);
    if (displayedFormId && displayedFormId !== id) captureAttribution(displayedFormId, window.location.search);
  }, [id, displayedFormId]);

  return (
    <FormStatusHandler withBackground
      isLoading={sessionLoading || isLoading || (isAuthed && draftLoading)} error={error} data={data}
      renderForm={(responseData) => {
        const lastRun = rerunFormId === id ? null : responseData.data.lastRun ?? null;
        const lastRunScreen = lastRun ? LAST_RUN_SCREEN[lastRun.state] : null;

        if (lastRunScreen) {
          return (
            <div className="relative h-dvh w-full font-sans text-neutral-200 overflow-y-auto scrollbar">
              <StatusScreen state={lastRunScreen} isWorkflow workflow={lastRun.workflow ?? null} reviewNote={lastRun.reviewNote ?? null}
                reviewedAt={lastRun.reviewedAt ?? null} isAuthed={isAuthed} onRerun={() => setRerunFormId(id)}
              />
            </div>
          );
        }

        return (
          <FormDisplayer key={responseData.data.form?.id ?? id} form={responseData.data.form} stage={responseData.data.stage ?? 0} isWorkflow={responseData.data.state != null}
            startFormId={responseData.data.startFormId ?? null} draft={isAuthed ? (draftData?.data ?? null) : null}
            journey={responseData.data.workflow ?? null} instanceId={responseData.data.instanceId ?? null}
            attempt={responseData.data.attempt ?? null} serverNow={responseData.data.serverNow ?? null} closesAt={responseData.data.closesAt ?? null}
          />
        );
      }}
      renderState={({ state, message, stage, startFormId, isWorkflow, reviewNote, reviewedAt, payload }) => (
        <div className="relative h-dvh w-full font-sans text-neutral-200 overflow-y-auto scrollbar">
          {state === "loading" ? <FormSkeleton /> : (
            <StatusScreen state={state} message={message} stage={stage} startFormId={startFormId} isWorkflow={isWorkflow}
              workflow={payload?.workflow ?? null} formTitle={payload?.formTitle ?? null} submittedAt={payload?.submittedAt ?? null}
              reviewNote={reviewNote} reviewedAt={reviewedAt} isAuthed={isAuthed} closesAt={payload?.closesAt ?? null}
            />
          )}
        </div>
      )}
    />
  );
}
