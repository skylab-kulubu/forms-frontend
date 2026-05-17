"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Copy, Loader2, RotateCcw, Share2, Timer, Trash2, X } from "lucide-react";

const buildShareUrl = (resource, id, token) => {
  if (typeof window === "undefined") return "";
  if (!id || !token) return "";
  const origin = window.location.origin;
  switch (resource) {
    case "component-group":
      return `${origin}/component-groups/${id}?token=${encodeURIComponent(token)}`;
    case "response":
      return `${origin}/responses/${id}?token=${encodeURIComponent(token)}`;
    default:
      return "";
  }
};

const formatExpiresAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

const getRemainingLabel = (expiresAt) => {
  if (!expiresAt) return null;
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return null;
  const diffMs = target - Date.now();
  if (diffMs <= 0) return "Süresi doldu";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hours <= 0) return `${minutes} dk kaldı`;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours === 0 ? `${days} gün kaldı` : `${days}g ${remHours}s kaldı`;
  }
  return `${hours}s ${minutes}dk kaldı`;
};

export default function ShareOverlay({
  open,
  onClose,
  resource = "component-group",
  resourceId,
  title = "Bağlantıyı Paylaş",
  description = "Bu bağlantıyla paylaşılan kişi grubu görüntüleyip kendi gruplarına ekleyebilir.",
  shareMutation,
  revokeMutation,
}) {
  const { mutate, data, isPending, isError, error, reset } = shareMutation;
  const revokeMutate = revokeMutation?.mutate;
  const isRevoking = revokeMutation?.isPending ?? false;
  const revokeReset = revokeMutation?.reset;

  const [copyState, setCopyState] = useState("idle");
  const [revoked, setRevoked] = useState(false);
  const copyTimerRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const tokenData = data?.data ?? null;
  const token = revoked ? null : tokenData?.token ?? null;
  const expiresAt = revoked ? null : tokenData?.expiresAt ?? null;

  const shareUrl = useMemo(() => buildShareUrl(resource, resourceId, token), [resource, resourceId, token]);
  const expiresLabel = formatExpiresAt(expiresAt);
  const [remaining, setRemaining] = useState(() => getRemainingLabel(expiresAt));

  useEffect(() => {
    if (!open) {
      hasTriggeredRef.current = false;
      reset();
      revokeReset?.();
      setCopyState("idle");
      setRevoked(false);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
      return;
    }

    if (!resourceId) return;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    mutate(resourceId);
  }, [open, resourceId, mutate, reset, revokeReset]);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    setRemaining(getRemainingLabel(expiresAt));
    const interval = setInterval(() => {
      setRemaining(getRemainingLabel(expiresAt));
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const handleCopy = async () => {
    if (!shareUrl) return;
    let next = "error";
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        next = "success";
      } catch {}
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyState(next);
    copyTimerRef.current = setTimeout(() => {
      setCopyState("idle");
      copyTimerRef.current = null;
    }, 2000);
  };

  const handleRetry = () => {
    if (!resourceId || isPending) return;
    reset();
    setCopyState("idle");
    mutate(resourceId);
  };

  const handleRevoke = () => {
    if (!resourceId || !revokeMutate || isRevoking) return;
    revokeMutate(resourceId, {
      onSuccess: () => setRevoked(true),
    });
  };

  const errorMessage = error?.message || "Bağlantı oluşturulamadı.";

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="share-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex h-dvh w-dvw items-center justify-center bg-neutral-950/20 backdrop-blur-sm px-4"
        >
          <motion.div key="share-card"
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-skylab-400/20 bg-skylab-400/10 text-skylab-400">
                  <Share2 size={16} />
                </div>
                <h2 className="text-base font-medium text-neutral-100">{title}</h2>
              </div>

              <button type="button" onClick={() => onClose?.()} aria-label="Kapat"
                className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <p className="text-[12px] leading-relaxed text-neutral-400">{description}</p>

              <AnimatePresence mode="wait" initial={false}>
                {revoked ? (
                  <motion.div key="revoked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-4 text-sm text-amber-200"
                  >
                    <Trash2 size={14} />
                    <span>Bağlantı iptal edildi</span>
                  </motion.div>
                ) : isPending ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-4 text-sm text-neutral-400"
                  >
                    <Loader2 size={14} className="animate-spin" />
                    <span>Bağlantı oluşturuluyor...</span>
                  </motion.div>
                ) : isError ? (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleAlert size={14} className="shrink-0" />
                      <span className="truncate">{errorMessage}</span>
                    </div>
                    <button type="button" onClick={handleRetry}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-neutral-200 hover:bg-white/10"
                    >
                      <RotateCcw size={12} /> Tekrar Dene
                    </button>
                  </motion.div>
                ) : shareUrl ? (
                  <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 pl-3 pr-1.5 py-1.5">
                      <input readOnly value={shareUrl} onFocus={(e) => e.target.select()}
                        className="flex-1 min-w-0 bg-transparent text-sm text-neutral-100 outline-none truncate"
                      />
                      <button type="button" onClick={handleCopy} aria-label="Bağlantıyı kopyala"
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                          copyState === "success" ? "border border-skylab-400/30 bg-skylab-400/10 text-skylab-300"
                          : copyState === "error" ? "border border-red-500/30 bg-red-500/10 text-red-300"
                          : "border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
                        }`}
                      >
                        {copyState === "success" ? <Check size={13} /> : copyState === "error" ? <CircleAlert size={13} /> : <Copy size={13} />}
                        <span>{copyState === "success" ? "Kopyalandı" : copyState === "error" ? "Hata" : "Kopyala"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                      <div className="inline-flex items-center gap-1.5">
                        <Timer size={12} className="text-neutral-500" />
                        <span>{remaining ?? "Geçerli"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {expiresLabel && (
                          <span className="truncate text-neutral-600">{expiresLabel} tarihinde sona erer</span>
                        )}
                        {revokeMutate && (
                          <button type="button" onClick={handleRevoke} disabled={isRevoking}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRevoking ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            <span>İptal Et</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
