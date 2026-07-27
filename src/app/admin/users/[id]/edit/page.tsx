"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminUserForm } from "@/components/admin/user-form";
import { getAdminUser, type AdminUser } from "@/lib/admin";

export default function EditAdminUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);

  useEffect(() => {
    const found = getAdminUser(params.id);
    if (!found) {
      router.replace("/admin/users");
      return;
    }
    setUser(found);
  }, [params.id, router]);

  if (!user) return null;

  return <AdminUserForm initial={user} />;
}
