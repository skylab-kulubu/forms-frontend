"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, CheckCircle2, CircleAlert, ClipboardX, Eye, MoreHorizontal, PencilLine, Redo2, Share2, TriangleAlert, Undo2,
} from "lucide-react";
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, IconButton, MenuItem, StatusDot, buttonVariants,
} from "@skylab-kulubu/skylcn-ui";
import Popover from "@/app/components/utils/Popover";
import Tip from "@/app/admin/components/utils/Tip";
import { PeopleCount, PeopleStack } from "./StudioPresence";

const emptySubscribe = () => () => {};

// Off tools stay focusable: a tooltip never opens on a disabled button, and the delete's tooltip says why it is
// off. skylcn dims only :disabled, so this gives them the disabled look.
const OFF = "data-disabled:cursor-not-allowed data-disabled:opacity-60 data-disabled:hover:bg-transparent data-disabled:hover:text-muted-foreground";

function SaveButton({ onSave, isSaving, isError, error, saveLabel, saveExtra, draftNotice, onDraftNoticeClose, noun }) {
  return (
    <Popover open={isError || (draftNotice && !isError)} error={isError ? error : null}
      message={!isError && draftNotice ? "Veriler taslaklardan geldi" : null} variant={isError ? "error" : "info"} align="bottom-right"
      onClose={!isError && draftNotice ? onDraftNoticeClose : undefined}
    >
      <Button variant="primary" size="sm" onClick={onSave} pending={isSaving} aria-label={`${noun}u kaydet`} title="Kaydet (Ctrl+S)" className="ml-1">
        {isError ? <CircleAlert className="size-3.5 text-destructive" /> : <CheckCircle2 className="size-3.5" />}
        {saveLabel}
        {saveExtra ? <span className="rounded bg-skylab-400/15 px-1 text-3xs font-medium">{saveExtra}</span> : null}
      </Button>
    </Popover>
  );
}

function FullActions({ saveStatus, returnHref, people = [], onGoToPerson, fill, onShare, draft, onUndo, canUndo, onRedo, canRedo, issues, secondary, onSave, ...save }) {
  return (
    <div className="flex items-center gap-1 text-neutral-500">
      {returnHref ? (
        <Button variant="primary" size="sm" render={<a href={returnHref} />} aria-label="Etkinliğe dön" className="mr-1">
          <ArrowLeft className="size-3.5" />
          Etkinliğe dön
        </Button>
      ) : null}
      <PeopleStack people={people} onGo={onGoToPerson} />
      {saveStatus ? <div className="mr-2 hidden sm:block">{saveStatus}</div> : null}

      {fill ? (
        <IconButton variant="ghost" size="icon-sm" icon={fill.active ? PencilLine : Eye} onClick={fill.onToggle}
          label={fill.active ? "Düzenlemeye dön" : "Başvuran gibi doldur"} title={fill.active ? "Düzenlemeye dön (P)" : "Başvuran gibi doldur (P)"}
          className={fill.active ? "bg-skylab-500/15 text-skylab-300 hover:bg-skylab-500/20 hover:text-skylab-300" : undefined}
        />
      ) : null}

      {onShare ? <IconButton variant="ghost" size="icon-sm" icon={Share2} label={`${save.noun}u paylaş`} onClick={onShare} /> : null}

      {draft?.has ? <IconButton variant="ghost" size="icon-sm" icon={ClipboardX} label="Taslağı sil" onClick={draft.onDiscard} pending={draft.discarding} /> : null}

      <IconButton variant="ghost" size="icon-sm" icon={Undo2} label="Geri al" title="Geri al (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} focusableWhenDisabled className={OFF} />

      {onRedo ? (
        <IconButton variant="ghost" size="icon-sm" icon={Redo2} label="İleri al" title="İleri al (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo} focusableWhenDisabled className={OFF} />
      ) : null}

      {secondary ? (
        <IconButton variant="ghost" size="icon-sm" icon={secondary.icon} label={secondary.label} onClick={secondary.onClick} disabled={secondary.disabled} focusableWhenDisabled className={OFF} />
      ) : null}

      {issues?.count > 0 ? (
        <Tip label="Kaydı engelleyen sorunlar">
          <Button variant="destructive" size="sm" onClick={issues.onShow} aria-label="Sorunlar" className="ml-1 gap-1.5 px-2">
            <TriangleAlert className="size-3" />
            {issues.count}
          </Button>
        </Tip>
      ) : null}

      {onSave ? <SaveButton onSave={onSave} {...save} /> : null}
    </div>
  );
}

function CompactActions({ returnHref, people = [], onShare, draft, onUndo, canUndo, onRedo, canRedo, issues, secondary, onSave, ...save }) {
  const items = [
    returnHref ? { key: "return", label: "Etkinliğe dön", icon: ArrowLeft, onClick: () => window.location.assign(returnHref) } : null,
    issues?.count > 0 ? { key: "issues", label: `Kaydı engelleyen ${issues.count} sorun`, icon: TriangleAlert, onClick: issues.onShow, tone: "text-destructive" } : null,
    onShare ? { key: "share", label: `${save.noun}u paylaş`, icon: Share2, onClick: onShare } : null,
    onRedo ? { key: "redo", label: "İleri al", icon: Redo2, onClick: onRedo, disabled: !canRedo } : null,
    draft?.has ? { key: "draft", label: "Taslağı sil", icon: ClipboardX, onClick: draft.onDiscard, disabled: draft.discarding } : null,
    secondary ? { key: "secondary", label: secondary.label, icon: secondary.icon, onClick: secondary.onClick, disabled: secondary.disabled, destructive: true } : null,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-0.5 text-neutral-500">
      <PeopleCount people={people} />
      <IconButton variant="ghost" icon={Undo2} label="Geri al" tooltip={false} onClick={onUndo} disabled={!canUndo} />
      {items.length > 0 ? (
        // Not modal, so a tap outside both closes the menu and reaches what it lands on, as before
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger aria-label="Diğer işlemler" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <MoreHorizontal />
            {issues?.count > 0 ? <StatusDot tone="danger" glow={false} className="absolute right-1 top-1" /> : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-60">
            {items.map((item) => (
              <MenuItem key={item.key} icon={item.icon} disabled={item.disabled} destructive={item.destructive} onClick={item.onClick} className={item.tone}>
                {item.label}
              </MenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {onSave ? <SaveButton onSave={onSave} {...save} /> : null}
    </div>
  );
}

export default function StudioHeaderActions({ saveLabel = "Kaydet", noun = "Form", ...props }) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const desktop = isMounted ? document.getElementById("admin-header-slot") : null;
  const mobile = isMounted ? document.getElementById("admin-header-slot-mobile") : null;

  return (
    <>
      {desktop ? createPortal(<FullActions saveLabel={saveLabel} noun={noun} {...props} />, desktop, desktop.id) : null}
      {mobile ? createPortal(<CompactActions saveLabel={saveLabel} noun={noun} {...props} />, mobile, mobile.id) : null}
    </>
  );
}
