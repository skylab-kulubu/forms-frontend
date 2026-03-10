"use client";

import { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import SkylabLoader from "@/app/components/SkylabLoader";

function SignInLogic() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin";

  useEffect(() => {
    signIn("keycloak", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="grid h-screen place-items-center">
      <SkylabLoader size={64} color="#525252" />
    </div>
  );
}

export default function SignInRedirect() {
  return (
    <Suspense fallback={
      <div className="grid h-screen place-items-center">
        <SkylabLoader size={64} color="#525252" />
      </div>
    }>
      <SignInLogic />
    </Suspense>
  );
}