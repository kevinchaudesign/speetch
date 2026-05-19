"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./admin-sidebar";
import { AdminAssistant } from "./admin-assistant";

const COOKIE_NAME = "speetch_admin_sidebar_collapsed";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function AdminShell({
  email,
  initialCollapsed,
  children,
}: {
  email: string;
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      // Persist côté client. Re-rendus serveur le liront via next/headers.
      document.cookie = `${COOKIE_NAME}=${next ? "1" : "0"}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
      return next;
    });
  };

  return (
    <div className="min-h-svh w-full">
      <AdminSidebar
        email={email}
        collapsed={collapsed}
        onToggle={handleToggle}
      />
      <div
        className={cn(
          "flex min-h-svh flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "md:pl-24" : "md:pl-64",
        )}
      >
        {children}
      </div>
      <AdminAssistant email={email} />
    </div>
  );
}
