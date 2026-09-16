"use client";

import { useEffect } from "react";
import { useWidgetEvents, WidgetEvents } from "@rango-dev/widget-embedded";
import type { RouteEventData } from "@rango-dev/widget-embedded";

// Records Rango widget swaps into our own DB (POST /api/swaps) so the
// Dexifier explorer can show them alongside Exolix and Chainflip swaps.
// Fire-and-forget: tracking must never interfere with the swap itself.

const STATUS_BY_EVENT: Record<string, string> = {
  started: "running",
  succeeded: "success",
  failed: "failed",
};

function routeToPayload(data: RouteEventData) {
  const { route, event } = data;
  const steps = route.steps ?? [];
  const first = steps[0];
  const last = steps[steps.length - 1];
  if (!route.requestId || !first || !last) return null;
  const wallets = (route as { wallets?: Record<string, { address?: string }> })
    .wallets;
  const recipient =
    wallets && last.toBlockchain ? wallets[last.toBlockchain]?.address : undefined;
  return {
    provider: "rango",
    externalId: route.requestId,
    status: STATUS_BY_EVENT[event.type] ?? "running",
    fromChain: first.fromBlockchain,
    fromToken: first.fromSymbol,
    fromAmount: String(route.inputAmount ?? ""),
    toChain: last.toBlockchain,
    toToken: last.toSymbol,
    toAmount:
      (last as { expectedOutputAmountHumanReadable?: string })
        .expectedOutputAmountHumanReadable ??
      (last.outputAmount != null ? String(last.outputAmount) : null),
    recipientAddress: recipient ?? null,
    extra: { routeStatus: route.status, steps },
  };
}

const SwapTracker: React.FC = () => {
  const widgetEvents = useWidgetEvents();

  useEffect(() => {
    const handler = (data: RouteEventData) => {
      try {
        const payload = routeToPayload(data);
        if (!payload) return;
        fetch("/api/swaps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {
        // tracking must never break the widget
      }
    };
    widgetEvents.on(WidgetEvents.RouteEvent, handler);
    return () => widgetEvents.off(WidgetEvents.RouteEvent, handler);
  }, [widgetEvents]);

  return null;
};

export default SwapTracker;
