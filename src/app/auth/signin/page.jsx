"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SkylabLoader from "@/app/components/SkylabLoader";
import { loginWithKeycloak, getPostLoginRedirect } from "@/lib/authActions";
import { claimAuthRetry, inSilentFrame, releaseAuthRetry, reportAuthResult } from "@/lib/session-recovery";

function SignInLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get("callbackUrl");
  const error = searchParams?.get("error");

  useEffect(() => {
    if (inSilentFrame()) {
      reportAuthResult(false);
      return;
    }
    if (error && !claimAuthRetry()) {
      releaseAuthRetry();
      router.replace("/");
      return;
    }
    loginWithKeycloak(callbackUrl || getPostLoginRedirect() || "/admin");
  }, [callbackUrl, error, router]);

  return (
    <div className="grid h-dvh place-items-center">
      <SkylabLoader size={64} color="#525252" />
    </div>
  );
}

export default function SignInRedirect() {
  return (
    <Suspense fallback={
      <div className="grid h-dvh place-items-center">
        <SkylabLoader size={64} color="#525252" />
      </div>
    }>
      <SignInLogic />
    </Suspense>
  );
}
