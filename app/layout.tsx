import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTC Signal Engine | Research & Paper Trading",
  description: "Deterministic Bitcoin intelligence, Jev interpretation, and paper trading system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-900 text-zinc-100 antialiased selection:bg-btc-gold/20 selection:text-btc-gold">
        {children}
      </body>
    </html>
  );
}
