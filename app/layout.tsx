import type { Metadata } from "next";
import { QueryProvider } from "@/shared/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SatoshiSignal™ | Autonomous Bitcoin Directional Intelligence & Quant Terminal",
  description:
    "Institutional-grade autonomous Bitcoin quantitative telemetry, multi-timeframe alignment, Hyperliquid whale tracking, and deterministic signal synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-900 text-zinc-100 antialiased selection:bg-btc-gold/20 selection:text-btc-gold">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
