"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CheckCircle, XCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

interface StatusItem {
  label: string;
  status: "connected" | "disconnected" | "unknown";
  detail?: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { label: "Supabase", status: "unknown" },
    { label: "OCR Provider", status: "unknown" },
  ]);

  useEffect(() => {
    async function checkStatus() {
      const supabase = createClient();
      const items: StatusItem[] = [];

      // Check Supabase
      try {
        const { error } = await supabase.from("leads").select("id").limit(1);
        items.push({
          label: "Supabase Database",
          status: error ? "disconnected" : "connected",
          detail: error ? error.message : "Connected and responsive",
        });
      } catch {
        items.push({
          label: "Supabase Database",
          status: "disconnected",
          detail: "Cannot reach database",
        });
      }

      // Check storage
      try {
        const { error } = await supabase.storage.getBucket("business-cards");
        items.push({
          label: "Storage Bucket",
          status: error ? "disconnected" : "connected",
          detail: error ? "Bucket not found" : "business-cards bucket active",
        });
      } catch {
        items.push({
          label: "Storage Bucket",
          status: "disconnected",
          detail: "Cannot reach storage",
        });
      }

      // OCR provider
      items.push({
        label: "OCR Provider",
        status: "connected",
        detail: "Tesseract.js (local fallback always available)",
      });

      setStatuses(items);
    }
    checkStatus();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-text-muted mt-1">
            System status and configuration
          </p>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-border bg-panel p-5 space-y-4">
          <h2 className="font-semibold text-lg">Appearance</h2>
          {mounted && (
            <div className="flex gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  theme === "light"
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border bg-panel-2 text-text-muted hover:text-text"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border bg-panel-2 text-text-muted hover:text-text"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          )}
        </div>

        {/* Connectivity */}
        <div className="rounded-2xl border border-border bg-panel p-5 space-y-4">
          <h2 className="font-semibold text-lg">System Status</h2>
          <div className="space-y-3">
            {statuses.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.detail && (
                    <p className="text-xs text-text-muted">{item.detail}</p>
                  )}
                </div>
                {item.status === "connected" ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : item.status === "disconnected" ? (
                  <XCircle className="h-5 w-5 text-danger" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-panel-2 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
