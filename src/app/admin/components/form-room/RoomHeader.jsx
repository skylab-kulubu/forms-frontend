"use client";

import { AppShellActions, Button, IconButton } from "@skylab-kulubu/skylcn-ui";

export function HeaderIcon({ icon, label, onClick, disabled = false, pending = false }) {
  return <IconButton icon={icon} label={label} onClick={onClick} disabled={disabled} pending={pending} variant="ghost" size="icon-sm" />;
}

export function HeaderButton({ icon: Icon, label, onClick, disabled = false, pending = false, primary = false }) {
  return (
    <Button variant={primary ? "primary" : "outline"} size="sm" onClick={onClick} disabled={disabled} pending={pending} title={label} aria-label={label} className="ml-1">
      <Icon />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  );
}

export function HeaderTouch({ icon, label, onClick, disabled = false, pending = false }) {
  return <IconButton icon={icon} label={label} onClick={onClick} disabled={disabled} pending={pending} variant="ghost" size="icon-lg" tooltip={false} />;
}

export default function RoomHeader({ desktop = null, mobile = null }) {
  return (
    <AppShellActions phone={mobile ? <div className="flex items-center">{mobile}</div> : null}>
      {desktop ? <div className="flex items-center gap-1 text-neutral-500">{desktop}</div> : null}
    </AppShellActions>
  );
}
