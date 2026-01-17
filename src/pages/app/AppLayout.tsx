import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

/**
 * AppLayout wraps all authenticated application pages in a single
 * shell that provides the common navigation and layout. By
 * centralizing the AppShell here we avoid re‑rendering the shell
 * in every individual page and ensure consistent protected routing.
 */
export default function AppLayout() {
  return (
    <AppShell>
      <OfflineBanner />
      <Outlet />
    </AppShell>
  );
}