"use client";

import { useParams } from "next/navigation";
import ResponseDisplayer from "../components/response-displayer/ResponseDisplayer";
import { ResponseActions } from "../components/response-displayer/components/ResponseActions";
import { ResponseHeaderSkeleton, ResponseListSkeleton } from "../components/response-displayer/components/ResponseDisplayerComponents";
import { useResponseQuery } from "@/lib/hooks/useResponse";

export default function ResponsePage() {
  const params = useParams();
  const rawId = params?.id;
  const responseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data, isLoading, error } = useResponseQuery(responseId);
  const response = data?.data ?? data ?? null;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8">
            <div className="h-[93vh] bg-neutral-900/40 p-4 shadow-sm">
              <div className="flex h-full flex-col gap-4">
                <ResponseHeaderSkeleton />
                <div className="flex-1 overflow-hidden">
                  <ResponseListSkeleton />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="h-[93vh] bg-neutral-900/40 p-4 shadow-sm">
              <ResponseActions />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-6 text-sm text-neutral-400">
          Yanit yuklenemedi.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ResponseDisplayer response={response} />
    </div>
  );
}
