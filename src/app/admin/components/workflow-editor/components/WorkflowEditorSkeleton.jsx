const GHOST_NODES = [
  { x: 24, y: 150, title: "w-24" },
  { x: 300, y: 64, title: "w-28" },
  { x: 300, y: 240, title: "w-20" },
];

const GHOST_EDGES = [
  "M 242 208 C 278 208, 264 86, 300 86",
  "M 242 208 C 278 208, 264 262, 300 262",
];

function Bar({ className = "" }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md ${className}`} />;
}

function GhostNode({ x, y, title }) {
  return (
    <div className="absolute w-53 rounded-xl border border-white/10 bg-neutral-900 shadow-lg shadow-black/30" style={{ left: x, top: y }}>
      <div className="flex h-10.5 items-center gap-2.5 border-b border-white/5 px-3">
        <Bar className="size-6 shrink-0" />
        <Bar className={`h-3 ${title}`} />
      </div>
      <div className="flex h-7.5 items-center px-3">
        <Bar className="h-2.5 w-16" />
      </div>
    </div>
  );
}

function GhostSectionHeader({ pill = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Bar className="h-4 w-32" />
        <Bar className="h-2.5 w-52 max-w-full" />
      </div>
      {pill ? <Bar className="h-5 w-20 shrink-0 rounded-full" /> : null}
    </div>
  );
}

export default function WorkflowEditorSkeleton() {
  return (
    <div className="p-4" aria-busy="true">
      <span className="sr-only">Akış yükleniyor</span>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-11 flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col p-2 lg:col-span-8">
          <div className="mx-auto flex h-10 w-full max-w-3xl items-center border-b border-white/10 px-4">
            <Bar className="h-3.5 w-40" />
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-transparent bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px]">
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              {GHOST_EDGES.map((path) => (
                <path key={path} d={path} fill="none" stroke="#404040" strokeWidth={1.5} />
              ))}
            </svg>
            {GHOST_NODES.map((node) => <GhostNode key={`${node.x}-${node.y}`} {...node} />)}
          </div>
        </div>

        <div className="col-span-1 flex h-[92vh] items-center justify-end lg:hidden">
          <span className="-mr-4 h-full w-5 rounded-l-full border border-r-0 border-neutral-800 bg-[#121212]" />
        </div>

        <div className="col-span-4 hidden h-[calc(100dvh-5.5rem)] min-w-0 max-w-xl flex-col rounded-xl p-2 lg:flex">
          <div className="flex h-10 items-center border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide text-neutral-700">
            <span className="w-full">Adım</span>
            <span className="mx-2 h-3 w-px bg-neutral-800" />
            <span className="w-full">Akış</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-1">
            <div className="flex flex-col divide-y divide-neutral-800/60 p-4">
              <section className="space-y-4 pb-6">
                <GhostSectionHeader pill />
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bar className="h-3.5 w-24" />
                    <Bar className="h-2.5 w-48 max-w-full" />
                  </div>
                  <span className="h-7 w-12 shrink-0 rounded-full border border-white/10 bg-white/5" />
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((index) => <span key={index} className="h-8 flex-1 rounded-lg border border-white/10 bg-white/5" />)}
                </div>
              </section>

              <section className="space-y-4 py-6">
                <GhostSectionHeader />
                <div className="space-y-3">
                  {[0, 1].map((index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/40 px-3 py-2.5 shadow-sm">
                      <span className="size-9 shrink-0 rounded-lg border border-white/10 bg-neutral-900/60" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Bar className="h-3.5 w-3/5" />
                        <Bar className="h-2.5 w-2/5" />
                      </div>
                      <Bar className="h-6 w-20 shrink-0 rounded-lg" />
                    </div>
                  ))}
                </div>
                <span className="block h-8 rounded-lg border border-white/10 bg-white/5" />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
