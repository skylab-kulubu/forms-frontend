"use client";

import { Skeleton } from "@skylab-kulubu/skylcn-ui";
import { BrandSlot } from "@/brands/BrandContext";

function QuestionSkeleton({ divided }) {
  return (
    <div className={divided ? "pb-6" : ""}>
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          <Skeleton className="size-6 shrink-0" />
          <Skeleton className="mt-1.25 h-3.5 w-1/2" />
        </div>
        <Skeleton className="mt-3 h-9.5 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function FormSkeleton() {
  return (
    <div className="relative z-10 flex min-h-full w-full flex-col items-center px-4 sm:px-6" aria-busy="true" aria-label="Form yükleniyor">
      <div className="h-12 w-full shrink-0" />
      <div data-slot="form-card" className="mt-(--brand-card-top-space) flex w-full max-w-2xl flex-1 flex-col rounded-3xl border border-border bg-card shadow-2xl">
        <BrandSlot name="CardTop" />
        <div className="flex flex-col gap-6 p-6 sm:p-10">
          <Skeleton className="h-7.5 w-full rounded-lg" />
          <div className="flex flex-col px-2 md:px-4">
            <Skeleton className="h-7.5 w-3/5" />
            <Skeleton className="mt-4.5 h-3 w-11/12" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
          <div className="flex flex-col">
            <QuestionSkeleton divided />
            <QuestionSkeleton divided />
            <QuestionSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
