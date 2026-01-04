"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInRedirect() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  useEffect(() => {
    signIn("keycloak", { callbackUrl });
  }, [callbackUrl]);

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      yönlendirme sayfası
    </main>
  );
}