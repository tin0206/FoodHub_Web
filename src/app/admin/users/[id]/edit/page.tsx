"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminUserForm } from "@/components/admin/user-form";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getAdminUser } from "@/lib/api/admin-users";
import type { ApiUser } from "@/lib/api/types";

export default function EditAdminUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(params.id);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      router.replace("/admin/users");
      return;
    }
    if (!hasAccessToken()) {
      setError("Sign in with a real admin account to edit users.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getAdminUser(userId);
        if (!cancelled) setUser(data.user);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.status === 404
                ? "User not found."
                : err.message
              : "Failed to load user",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          Loading user…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "#F43F5E" }}>
          {error || "User not found."}
        </p>
      </div>
    );
  }

  return <AdminUserForm initial={user} />;
}
