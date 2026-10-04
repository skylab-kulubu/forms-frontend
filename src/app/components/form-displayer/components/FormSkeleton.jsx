function QuestionSkeleton({ divided }) {
  return (
    <div className={divided ? "border-b border-white/5 pb-6" : ""}>
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          <span className="shimmer size-6 shrink-0 rounded-md" />
          <span className="shimmer mt-1.25 h-3.5 w-1/2 rounded-md" />
        </div>
        <span className="shimmer mt-3 h-9.5 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function FormSkeleton() {
  return (
    <div className="relative z-10 flex min-h-full w-full flex-col items-center px-4 sm:px-6" aria-busy="true" aria-label="Form yükleniyor">
      <div className="h-12 w-full shrink-0" />
      <div className="flex w-full max-w-2xl flex-1 flex-col rounded-3xl border border-white/10 bg-white/3 shadow-2xl">
        <div className="flex flex-col gap-6 p-6 sm:p-10">
          <span className="shimmer h-7.5 w-full rounded-lg" />
          <div className="flex flex-col px-2 md:px-4">
            <span className="shimmer h-7.5 w-3/5 rounded-md" />
            <span className="shimmer mt-4.5 h-3 w-11/12 rounded-md" />
            <span className="shimmer mt-2 h-3 w-3/4 rounded-md" />
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
