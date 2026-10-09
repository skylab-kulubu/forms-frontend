import { useSession } from "next-auth/react";

export function useRespondent() {
  const { data: session, status } = useSession();

  if (status === "loading") return { kind: "loading", user: null };
  if (status !== "authenticated") return { kind: "guest", user: null };
  return { kind: "user", user: session?.user ?? null };
}
