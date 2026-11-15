"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Copy, RotateCcw, Share2, Timer, Trash2, X } from "lucide-react";
import { Button, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogTitle, Input, Notice, SkylabLoader } from "@skylab-kulubu/skylcn-ui";

const buildShareUrl = (resource, id, token) => {
  if (typeof window === "undefined") return "";
  if (!id) return "";
  const origin = window.location.origin;
  switch (resource) {
    case "component-group":
      return token ? `${origin}/templates/${id}?token=${encodeURIComponent(token)}` : "";
    case "response":
      return token ? `${origin}/responses/${id}?token=${encodeURIComponent(token)}` : "";
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

const COPY_STATE = {
  idle: { Icon: Copy, text: "Kopyala", variant: "outline" },
  success: { Icon: Check, text: "Kopyalandı", variant: "primary" },
  error: { Icon: CircleAlert, text: "Hata", variant: "destructive" },
};

const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

function CopyField({ value, copyState, onCopy, label = "Bağlantıyı kopyala" }) {
  const { Icon, text, variant } = COPY_STATE[copyState] ?? COPY_STATE.idle;
  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={value} onFocus={(e) => e.target.select()} className="flex-1 truncate" />
      <Button type="button" variant={variant} size="lg" onClick={onCopy} aria-label={label} className="min-w-28">
        <Icon className="size-3.5" />
        {text}
      </Button>
    </div>
  );
}

export default function ShareOverlay({
  open,
  onClose,
  resource = "component-group",
  resourceId,
  title = "Bağlantıyı Paylaş",
  description = "Bu bağlantıyla paylaşılan kişi şablonu görüntüleyip kendi şablonlarına ekleyebilir.",
  shareMutation,
  revokeMutation,
}) {
  const isDirect = !shareMutation;
  const { mutate, data, isPending, isError, error, reset } = shareMutation ?? {};
  const revokeMutate = revokeMutation?.mutate;
  const isRevoking = revokeMutation?.isPending ?? false;
  const revokeReset = revokeMutation?.reset;

  const [copyState, setCopyState] = useState("idle");
  const [revoked, setRevoked] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [, setTick] = useState(0);
  const copyTimerRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setCopyState("idle");
      setRevoked(false);
    }
  }

  const tokenData = data?.data ?? null;
  const token = revoked ? null : tokenData?.token ?? null;
  const expiresAt = revoked ? null : tokenData?.expiresAt ?? null;

  const shareUrl = useMemo(() => buildShareUrl(resource, resourceId, token), [resource, resourceId, token]);
  const expiresLabel = formatExpiresAt(expiresAt);
  const remaining = getRemainingLabel(expiresAt);

  useEffect(() => {
    if (!open) {
      hasTriggeredRef.current = false;
      reset?.();
      revokeReset?.();
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
      return;
    }

    if (isDirect) return;
    if (!resourceId) return;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    mutate(resourceId);
  }, [open, resourceId, mutate, reset, revokeReset, isDirect]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const copyValue = async (value, setState, timerRef) => {
    if (!value) return;
    let next = "error";
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        next = "success";
      } catch {}
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(next);
    timerRef.current = setTimeout(() => {
      setState("idle");
      timerRef.current = null;
    }, 2000);
  };

  const handleCopy = () => copyValue(shareUrl, setCopyState, copyTimerRef);

  const handleRetry = () => {
    if (!resourceId || isPending || isDirect) return;
    reset?.();
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
    <Dialog open={Boolean(open)} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent hideClose className="sm:max-w-xl">
        <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-2.5">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg border border-skylab-400/30 bg-skylab-500/10 text-skylab-300">
            <Share2 className="size-4" />
          </span>
          <DialogTitle className="min-w-0 flex-1 py-1 font-medium">{title}</DialogTitle>
          <DialogClose aria-label="Kapat"
            className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-subtle-foreground outline-hidden transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        <DialogBody className="flex flex-col gap-4 py-5">
          <DialogDescription>{description}</DialogDescription>

          <AnimatePresence mode="wait" initial={false}>
            {revoked ? (
              <motion.div key="revoked" {...FADE}>
                <Notice tone="warning" icon={Trash2}>Bağlantı iptal edildi</Notice>
              </motion.div>
            ) : isPending ? (
              <motion.div key="loading" {...FADE} role="status"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground"
              >
                <SkylabLoader size={14} />
                <span>Bağlantı oluşturuluyor...</span>
              </motion.div>
            ) : isError ? (
              <motion.div key="error" {...FADE}>
                <Notice tone="danger"
                  action={(
                    <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
                      <RotateCcw className="size-3" /> Tekrar Dene
                    </Button>
                  )}
                >
                  {errorMessage}
                </Notice>
              </motion.div>
            ) : shareUrl ? (
              <motion.div key="ready" {...FADE} className="flex flex-col gap-3">
                <CopyField value={shareUrl} copyState={copyState} onCopy={handleCopy} />

                {(expiresAt || remaining) && (
                  <div className="flex items-center justify-between gap-2 text-2xs text-subtle-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Timer className="size-3" />
                      <span>{remaining ?? "Geçerli"}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      {expiresLabel && (
                        <span className="truncate text-faint-foreground">{expiresLabel} tarihinde sona erer</span>
                      )}
                      {revokeMutate && (
                        <Button type="button" variant="destructive" size="sm" pending={isRevoking} onClick={handleRevoke}>
                          <Trash2 className="size-3" />
                          İptal Et
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
