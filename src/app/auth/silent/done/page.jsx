"use client";

import { useEffect } from "react";
import SkylabLoader from "@/app/components/SkylabLoader";
import { reportAuthResult } from "@/lib/session-recovery";

export default function SignInDone() {
  useEffect(() => {
    if (reportAuthResult(true) === "frame") return;
    window.close();
    const timer = setTimeout(() => window.location.replace("/"), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid h-dvh place-items-center">
      <SkylabLoader size={64} color="#525252" />
    </div>
  );
}
