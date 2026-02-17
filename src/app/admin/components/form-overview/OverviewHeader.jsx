import { motion } from "framer-motion";
import { PencilLine, List, RefreshCw } from "lucide-react";
import ActionButton from "../utils/ActionButton";

const fadeIn = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

const STATUS_STYLES = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  inactive: "border-red-500/30 bg-red-500/10 text-red-200",
};

export default function OverviewHeader({ formTitle, formId, formStatus, onEdit, onViewResponses, onRefresh,
  stats = { totalResponses: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 },
}) {
  const isActive = formStatus === 1;
  const statusLabel = isActive ? "Aktif" : "Pasif";
  const statusStyle = isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive;

  return (
    <motion.div {...fadeIn} className="flex gap-6 flex-col lg:flex-row">
      <div className="flex-1 lg:max-w-[55%] border-b border-white/10 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-200 truncate">
                {formTitle || "--"}
              </h1>
              <span className={`rounded-md border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs mt-1 text-neutral-500">
              ID: {formId || "--"}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3 shrink-0">
            <ActionButton icon={RefreshCw} onClick={onRefresh} size="md" tone="header" title="Yenile" aria-label="Yenile"/>
            <ActionButton icon={List} onClick={onViewResponses} size="md" tone="header" title="Cevaplar" aria-label="Cevaplar"/>
            <ActionButton icon={PencilLine} variant="primary" onClick={onEdit} size="md" tone="header" title="Düzenle" aria-label="Düzenle"/>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-[45%] border-b border-white/10 pb-2">
        <div className="flex items-start justify-between h-full">
          <p className="text-[14px] uppercase tracking-wide text-neutral-500 mt-6.5">Metrikler</p>
          <div className="flex flex-wrap items-center text-center gap-3 mt-3">
            <StatBlock label="Toplam Cevap" value={stats.totalResponses} />
            <StatBlock label="Bekleyen" value={stats.pendingCount} />
            <StatBlock label="Onaylanan" value={stats.approvedCount} />
            <StatBlock label="Reddedilen" value={stats.rejectedCount} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="text-[11px] text-neutral-400">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-neutral-100">{value ?? 0}</p>
    </div>
  );
}
