"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/session", { method: "DELETE" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-red-50 hover:text-red-700 lg:mb-3"
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </button>
  );
}
