import type { Metadata } from "next";
import PerpClient from "./PerpClient";

export const metadata: Metadata = {
  title: "Perps | Dexifier",
  description:
    "Trade perpetual futures on Dexifier — professional terminal powered by Hyperliquid. No sign-ups, self-custodial, up to 40x leverage.",
};

export default function PerpPage() {
  return <PerpClient />;
}
