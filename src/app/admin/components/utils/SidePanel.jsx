"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Input, MenuItem, MenuSeparator, Notice, Select, StatusDot,
  Switch as SkylcnSwitch, Textarea, ToggleRow as SkylcnToggleRow, buttonVariants, cn,
} from "@skylab-kulubu/skylcn-ui";

export const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const PANEL_STACK = "flex flex-col divide-y divide-border-subtle p-4 text-sm text-secondary-foreground";
export const PANEL_SECTION = "space-y-4 py-6 first:pt-0";
export const ROW = "rounded-lg border transition-[border-color,background-color,box-shadow] duration-200";
export const ROW_HOVER = "hover:border-border-strong hover:bg-row-highlight";
export const TILE = "grid size-9 shrink-0 place-items-center rounded-lg border bg-background/60 text-xs font-semibold";

const DOT_TONE = { emerald: "success", skylab: "brand", neutral: "neutral", amber: "warning", red: "danger" };
const NOTICE_TONE = { amber: "warning", red: "danger", neutral: "info" };

function variantOf({ danger, active }) {
  return active ? "primary" : danger ? "destructive" : "outline";
}

export function actionClass({ danger = false, active = false, compact = false } = {}) {
  return cn(buttonVariants({ variant: variantOf({ danger, active }), size: "sm" }), compact && "h-6");
}

export function StatePill({ tone = "skylab", children }) {
  return (
    <span className={`flex h-6 shrink-0 items-center gap-1.5 text-2xs font-medium ${tone === "neutral" ? "text-muted-foreground" : "text-secondary-foreground"}`}>
      <StatusDot tone={DOT_TONE[tone] ?? "neutral"} glow={tone !== "neutral" && tone !== "skylab"} />
      {children}
    </span>
  );
}

export function SectionHeader({ title, description, pill, pillTone = "skylab", dot, expanded, onToggle }) {
  const heading = (
    <div className="min-w-0">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        {dot ? <span className={`size-1.5 shrink-0 rounded-full ${dot}`} /> : null}
        <span className="min-w-0 truncate">{title}</span>
        {onToggle ? (
          <ChevronDown size={14} className={`shrink-0 text-subtle-foreground transition-transform duration-200 group-hover:text-secondary-foreground ${expanded ? "" : "-rotate-90"}`} />
        ) : null}
      </p>
      {description ? <p className="mt-1 text-2xs leading-relaxed text-subtle-foreground">{description}</p> : null}
    </div>
  );
  const status = pill ? <StatePill tone={pillTone}>{pill}</StatePill> : null;

  if (onToggle) {
    return (
      <button type="button" onClick={onToggle} aria-expanded={expanded}
        className={`group flex w-full items-start justify-between gap-4 rounded text-left ${FOCUS_RING}`}
      >
        {heading}
        {status}
      </button>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      {heading}
      {status}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled = false, small = false, className = "" }) {
  return <SkylcnSwitch checked={Boolean(checked)} onCheckedChange={() => onChange?.()} disabled={disabled} size={small ? "sm" : undefined} aria-label={label} className={className} />;
}

export function ToggleRow({ title, checkedTitle, description, checked, onChange, disabled = false, dimmed = false, adornment = null, children }) {
  return (
    <SkylcnToggleRow title={title} checkedTitle={checkedTitle} description={description} checked={Boolean(checked)} onCheckedChange={() => onChange?.()}
      disabled={disabled} dimmed={dimmed} adornment={adornment} aria-label={typeof title === "string" ? title : undefined}
    >
      {children}
    </SkylcnToggleRow>
  );
}

// touch is taken off the props and dropped: the sm Button already grows on coarse pointers
export function PanelButton({ icon: Icon, iconClassName = "", children, danger = false, active = false, chevron = false, compact = false, touch: _touch, className = "", ...props }) {
  return (
    <Button variant={variantOf({ danger, active })} size="sm" className={cn(compact && "h-6", className)} {...props}>
      {Icon ? <Icon aria-hidden className={iconClassName} /> : null}
      {children}
      {chevron ? <ChevronDown aria-hidden className={`-ml-0.5 size-3 transition-transform duration-200 ${active ? "rotate-180" : ""}`} /> : null}
    </Button>
  );
}

export function PanelInput({ icon = Search, className = "", ...props }) {
  return <Input type="text" icon={icon} inputSize="sm" className={className} {...props} />;
}

// block, because the textarea is inline by default and would leave a line's descender under it
export function PanelTextarea({ className = "", ...props }) {
  return <Textarea size="sm" className={cn("block", className)} {...props} />;
}

export function PanelNotice({ tone = "amber", className = "", children }) {
  return <Notice tone={NOTICE_TONE[tone] ?? "warning"} className={className}>{children}</Notice>;
}

export function PillBadge({ children }) {
  return <Badge size="md" className="min-w-22 max-w-36 justify-center">{children}</Badge>;
}

const stop = (event) => event.stopPropagation();
const keyOf = (value) => String(value);

// The menu's own pill, written out because skylcn keeps its Select pill classes to itself; it
// matches Select's pill so a row never shows two kinds of trigger
const PILL_TRIGGER = "group/pill inline-flex h-6.5 min-w-22 shrink-0 items-center justify-between gap-1 rounded-lg border border-border bg-muted px-2.5 text-2xs font-medium text-secondary-foreground outline-hidden pointer-coarse:h-8 transition-colors duration-(--motion-duration-fast) hover:border-border-strong hover:bg-accent-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-skylab-600/25 data-popup-open:border-border-strong data-popup-open:bg-popover data-popup-open:text-foreground";
const QUIET_TRIGGER = `group/pill flex min-w-0 max-w-full items-start gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-foreground data-popup-open:border-border-strong data-popup-open:bg-popover data-popup-open:text-foreground ${FOCUS_RING}`;

/*
 * The pill menus of the panels. Select draws them; the few that need what Select has no prop for
 * (opened from elsewhere, a delete row that is off and says why, the quiet text trigger with a
 * leading mark) fall back to skylcn's DropdownMenu, styled to read as the same list.
 */
export function MenuPill(props) {
  const { quiet = false, open, onDelete } = props;
  if (quiet || open !== undefined || onDelete === null) return <MenuPillMenu {...props} />;
  return <MenuPillSelect {...props} />;
}

function MenuPillSelect({ value, options, onSelect, placeholder = "", italic = false, wide = false, onDelete, deleteLabel = "Kaldır", label }) {
  return (
    // The pill sits in clickable rows, and the studio listens for shortcut keys on window. The list is
    // portaled but bubbles through React, so clicks and keys on either stop here, as the old menu's did
    <span className="contents" onClick={stop} onKeyDown={stop}>
      {/* Select's value box is a flex row, which clips a long label without an ellipsis; the label's own span draws it */}
      <Select variant="pill" aria-label={label} placeholder={placeholder}
        value={value == null ? null : keyOf(value)}
        options={options.map((option) => ({
          value: keyOf(option.value), label: <span className="truncate">{option.label}</span>, disabled: option.disabled, hint: option.hint ?? undefined,
        }))}
        onValueChange={(next) => {
          const option = options.find((item) => keyOf(item.value) === next);
          if (option && option.value !== value) onSelect(option.value);
        }}
        action={onDelete ? { label: deleteLabel, onSelect: onDelete, destructive: true } : undefined}
        tone={italic ? "text-muted-foreground" : undefined}
        className={cn(wide && "max-w-52", italic && "italic")}
      />
    </span>
  );
}

function MenuPillMenu({ value, options, onSelect, placeholder = "", italic = false, wide = false, quiet = false, dim = false, leading = null, onDelete, deleteLabel = "Kaldır", deleteHint, open: controlledOpen, onOpenChange, label }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const current = options.find((option) => option.value === value);

  const choose = (option) => {
    setOpen(false);
    if (option.value !== value) onSelect(option.value);
  };

  return (
    <span className="contents" onClick={stop} onKeyDown={stop}>
      <DropdownMenu open={open} onOpenChange={(next) => setOpen(next)}>
        <DropdownMenuTrigger aria-label={label}
          className={quiet
            ? cn(QUIET_TRIGGER, dim ? "text-muted-foreground" : "text-secondary-foreground")
            : cn(PILL_TRIGGER, wide ? "max-w-52" : "max-w-36", italic && "italic", current ? (italic ? "text-muted-foreground" : "") : "text-subtle-foreground")}
        >
          {leading}
          <span className={quiet ? "min-w-0" : "min-w-0 truncate"}>{current?.label ?? placeholder}</span>
          <ChevronDown aria-hidden
            className={`size-2.75 shrink-0 transition-transform duration-(--motion-duration-base) group-data-popup-open/pill:rotate-180 ${quiet ? "mt-0.75 opacity-40" : "opacity-70"}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={quiet ? "start" : "end"} sideOffset={6}
          className={cn("scrollbar max-h-72 overflow-y-auto", quiet ? "max-w-[min(26rem,calc(100vw-2rem))]" : "max-w-72")}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <MenuItem key={keyOf(option.value)} disabled={option.disabled} onClick={() => choose(option)}
                className={cn("justify-between", selected && "bg-skylab-600/20 text-foreground")}
              >
                <span className={quiet ? "min-w-0 flex-1" : "min-w-0 flex-1 truncate"}>{option.label}</span>
                {selected ? <Check aria-hidden className="size-3 text-skylab-600" />
                  : option.hint ? <span className="shrink-0 text-3xs text-subtle-foreground">{option.hint}</span> : null}
              </MenuItem>
            );
          })}

          {onDelete !== undefined ? (
            <>
              {options.length > 0 ? <MenuSeparator /> : null}
              <MenuItem destructive disabled={!onDelete} onClick={() => { setOpen(false); onDelete?.(); }} className="flex-col items-start gap-0.5">
                {deleteLabel}
                {!onDelete && deleteHint ? <span className="text-3xs text-faint-foreground">{deleteHint}</span> : null}
              </MenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
