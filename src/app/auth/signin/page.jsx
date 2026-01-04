"use client";

import { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInLogic() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin";

  useEffect(() => {
    signIn("keycloak", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="grid h-screen place-items-center">
      <Loader2 className="h-10 w-10 animate-spin text-neutral-600" />
    </div>
  );
}

export default function SignInRedirect() {
  return (
    <Suspense fallback={
      <div className="grid h-screen place-items-center">
        <Loader2 className="h-10 w-10 text-neutral-600" />
      </div>
    }>
      <SignInLogic />
    </Suspense>
  );
}