import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { startHealthCheckScheduler } from "@/lib/healthCheckScheduler";

// Next 14's instrumentation.ts hook (the "correct" place for this) doesn't reliably fire on
// `next start` in this setup, so we kick the scheduler off here instead - the root layout module
// is loaded once per server process, before any page renders. Idempotent via the `started` guard.
startHealthCheckScheduler();

export const metadata: Metadata = {
  title: "IT System Management Hub",
  description: "Sistem yönetim panellerine merkezi erişim",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
