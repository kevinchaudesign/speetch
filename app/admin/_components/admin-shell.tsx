"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./admin-sidebar";
import { AdminAssistant } from "./admin-assistant";
import { AdminTopbar } from "./admin-topbar";
import { KonamiCode } from "./konami-code";
import { AdminCursor } from "./admin-cursor";
import { RouteTransition } from "./route-transition";

const COOKIE_NAME = "speetch_admin_sidebar_collapsed";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function AdminShell({
  email,
  displayName,
  ownerProfileId,
  avatarUrl,
  initialCollapsed,
  children,
}: {
  email: string;
  displayName: string | null;
  ownerProfileId: string | null;
  avatarUrl: string | null;
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
        ownerProfileId={ownerProfileId}
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
      <AdminTopbar displayName={displayName} avatarUrl={avatarUrl} />
      <AdminAssistant email={email} displayName={displayName} />
      <KonamiCode />
      <AdminCursor />
      <RouteTransition />
    </div>
  );
}
