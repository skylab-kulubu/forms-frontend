function Bar({ className = "" }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md ${className}`} />;
}

export default function StudioSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0" aria-busy="true" aria-label="Form tuvali yükleniyor">
      <aside className="hidden w-60 shrink-0 flex-col gap-3 p-4 xl:flex">
        <Bar className="h-6 w-40" />
        <div className="mt-3 space-y-2.5">
          {Array.from({ length: 8 }, (_, index) => <Bar key={index} className={`h-3.5 ${index % 3 === 0 ? "w-36" : "w-44"}`} />)}
        </div>
      </aside>
      <main className="min-w-0 flex-1 py-2">
        <div className="h-full rounded-xl bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px]">
          <div className="mx-auto w-full max-w-[672px] px-4 pt-16">
            <div className="space-y-6 rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 sm:p-10">
              <Bar className="h-8 w-2/3" />
              <Bar className="h-4 w-1/2" />
              {Array.from({ length: 4 }, (_, index) => <Bar key={index} className="h-20 rounded-xl" />)}
            </div>
          </div>
        </div>
      </main>
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 p-4 lg:flex">
        <Bar className="h-5 w-32" />
        {Array.from({ length: 4 }, (_, index) => <Bar key={index} className="h-16 rounded-lg" />)}
      </aside>
    </div>
  );
}
