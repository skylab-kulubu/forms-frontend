"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { AUTH_DONE_PATH, inSilentFrame, reportAuthResult } from "@/lib/session-recovery";

export default function SilentSignIn() {
  useEffect(() => {
    if (!inSilentFrame()) {
      window.location.replace("/");
      return;
    }
    signIn("keycloak", { callbackUrl: AUTH_DONE_PATH }, { prompt: "none" }).catch(() => reportAuthResult(false));
  }, []);

  return null;
}
