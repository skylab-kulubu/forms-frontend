"use client";

import { ConfirmDialog } from "@skylab-kulubu/skylcn-ui";
import { Dot } from "lucide-react";
import { APPROVAL_PRESETS } from "./approval-presets";

const read = (value, context) => (typeof value === "function" ? value(context) : value);

export default function ApprovalOverlay({ open, preset, context = {}, onApprove, onReject }) {
  const config = APPROVAL_PRESETS[preset] ?? APPROVAL_PRESETS.default;
  const delayed = config.variant === "delayed";
  const list = (value) => {
    const items = read(value, context);
    return Array.isArray(items) ? items : [];
  };

  return (
    <ConfirmDialog
      open={Boolean(open)}
      onOpenChange={(next) => { if (!next) onReject?.(); }}
      icon={config.icon ?? Dot}
      title={config.title ?? "Onay gerekiyor"}
      description={read(config.description, context)}
      consequences={list(config.consequences)}
      unaffected={list(config.unaffected)}
      destructive={Boolean(config.destructive)}
      confirmText={delayed ? undefined : config.requiredPhrase ?? "Kabul ediyorum"}
      delay={delayed ? Math.max(0, Math.round(config.delaySeconds ?? 3)) : 0}
      actionLabel={read(config.approveLabel, context) ?? "Onaylıyorum"}
      cancelLabel={read(config.rejectLabel, context) ?? "Onaylamıyorum"}
      // Call sites run their mutation and close the overlay themselves; an onApprove that returns a
      // promise also gets the dialog's own lock, in-dialog failure and close on success
      pending={Boolean(context.isPending)}
      onAction={() => onApprove?.()}
    />
  );
}
