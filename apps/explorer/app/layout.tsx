import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: {
    default: "Dexifier Explorer — Cross-chain swap tracker",
    template: "%s · Dexifier Explorer",
  },
  description:
    "Track cross-chain swaps routed through Dexifier: status, amounts, chains and on-chain transaction links, in real time.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        className="min-h-screen antialiased"
        style={{ fontFamily: "var(--font-body), sans-serif" }}
      >
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
        </div>
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
