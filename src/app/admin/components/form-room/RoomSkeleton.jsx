function Bar({ className = "" }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 sm:p-10" aria-hidden="true">
      <Bar className="h-8 w-2/3" />
      <Bar className="h-4 w-1/2" />
      {Array.from({ length: 4 }, (_, index) => <Bar key={index} className="h-20 rounded-xl" />)}
    </div>
  );
}

export default function RoomSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-57px)] min-h-0 md:h-[calc(100dvh-3.5rem)]" aria-busy="true" aria-label="Form yükleniyor">
      <aside className="hidden min-w-60 flex-[0_1_304px] flex-col gap-3 p-4 2xl:flex">
        <Bar className="h-6 w-40" />
        <div className="mt-3 space-y-2.5">
          {Array.from({ length: 8 }, (_, index) => <Bar key={index} className={`h-3.5 ${index % 3 === 0 ? "w-36" : "w-44"}`} />)}
        </div>
      </aside>
      <main className="min-w-0 flex-[1_1_784px] py-2">
        <div className="h-full rounded-xl bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px]">
          <div className="mx-auto w-full max-w-[672px] px-3 pt-4 sm:px-0 sm:pt-10">
            <div className="mb-3 flex flex-col gap-1 px-1">
              <Bar className="h-4 w-48" />
              <Bar className="mt-2 h-4 w-72" />
            </div>
            <CardSkeleton />
          </div>
        </div>
      </main>
      <aside className="hidden min-w-80 flex-[0_1_440px] flex-col gap-4 p-4 xl:flex">
        <Bar className="h-5 w-32" />
        {Array.from({ length: 4 }, (_, index) => <Bar key={index} className="h-16 rounded-lg" />)}
      </aside>
    </div>
  );
}
