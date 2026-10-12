import { useSession } from "next-auth/react";
import { useRecoveryStatus } from "@/lib/session-recovery";

export function useRespondent() {
  const { data: session, status } = useSession();
  const recovery = useRecoveryStatus();

  if (status === "loading") return { kind: "loading", user: null };
  if (status !== "authenticated") return { kind: "guest", user: null };
  if (session?.error === "RefreshAccessTokenError" && recovery === "failed") return { kind: "expired", user: null };
  return { kind: "user", user: session?.user ?? null };
}
