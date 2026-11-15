"use client";

import { Button, SkylabMark } from "@skylab-kulubu/skylcn-ui";
import { ChevronRight } from "lucide-react";

function SkylabIcon() {
  return <SkylabMark />;
}

export default function LoginButton({ onClick, disabled = false, label = "E-Skylab ile giriş yap", className = "", hoverIcon = "skylab" }) {
  return (
    <Button variant="primary" onClick={onClick} disabled={disabled} hoverIcon={hoverIcon === "arrow" ? ChevronRight : SkylabIcon}
      className={`min-w-24 ${className}`}
    >
      {label}
    </Button>
  );
}
