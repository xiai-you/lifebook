import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = { title: "设置 · LifeBook" };

export default function SettingsRoute() {
  return (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  );
}
