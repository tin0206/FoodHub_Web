"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getPostLoginPath } from "@/lib/auth";

/** Renders nothing; sends an already-authenticated visitor straight to the app. */
export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) router.replace(getPostLoginPath(user));
  }, [router]);

  return null;
}
