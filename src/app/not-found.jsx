"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.replace(pathname.startsWith("/admin") ? "/admin" : "/");
  }, [pathname, router]);

  return null;
}