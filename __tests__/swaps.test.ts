import { describe, expect, it, vi } from "vitest";
import { validateSwapInput } from "@/lib/server/swaps";
import { mapChainflipStatus, mapExolixStatus } from "@/lib/server/swap-status";

// server-only throws outside RSC — stub it for the test env
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const valid = {
  provider: "rango",
  externalId: "61d51b11-79ea-4bd4-acb5-c8eed62a2a7b",
  fromChain: "ETH",
  fromToken: "USDT",
  fromAmount: "98.35",
  toChain: "SOL",
  toToken: "SOL",
};

describe("validateSwapInput", () => {
  it("accepts a well-formed record", () => {
    const input = validateSwapInput(valid);
    expect(input).not.toBeNull();
    expect(input?.provider).toBe("rango");
    expect(input?.status).toBeUndefined();
  });

  it("rejects unknown providers", () => {
    expect(validateSwapInput({ ...valid, provider: "binance" })).toBeNull();
  });

  it("rejects missing required fields", () => {
    expect(validateSwapInput({ ...valid, externalId: "" })).toBeNull();
    expect(validateSwapInput({ ...valid, toToken: undefined })).toBeNull();
    expect(validateSwapInput(null)).toBeNull();
    expect(validateSwapInput("junk")).toBeNull();
  });

  it("rejects invalid status values", () => {
    expect(validateSwapInput({ ...valid, status: "maybe" })).toBeNull();
    expect(validateSwapInput({ ...valid, status: "success" })?.status).toBe("success");
  });

  it("allows empty fromAmount (Chainflip fills it via status refresh)", () => {
    const input = validateSwapInput({ ...valid, provider: "chainflip", fromAmount: "" });
    expect(input).not.toBeNull();
    expect(input?.fromAmount).toBe("");
  });

  it("truncates nothing but rejects overlong garbage", () => {
    expect(
      validateSwapInput({ ...valid, externalId: "x".repeat(300) }),
    ).toBeNull();
    expect(
      validateSwapInput({ ...valid, fromAmount: "9".repeat(100) }),
    ).toBeNull();
  });

  it("drops negative/NaN feeUsd but keeps valid ones", () => {
    expect(validateSwapInput({ ...valid, feeUsd: -5 })?.feeUsd).toBeNull();
    expect(validateSwapInput({ ...valid, feeUsd: 1.25 })?.feeUsd).toBe(1.25);
  });
});

describe("provider status mapping", () => {
  it("maps Exolix statuses to normalized ones", () => {
    expect(mapExolixStatus("success")).toBe("success");
    expect(mapExolixStatus("error")).toBe("failed");
    expect(mapExolixStatus("refunded")).toBe("refunded");
    expect(mapExolixStatus("wait")).toBe("running");
    expect(mapExolixStatus("exchanging")).toBe("running");
    expect(mapExolixStatus("overdue")).toBe("running");
  });

  it("maps Chainflip states to normalized ones", () => {
    expect(mapChainflipStatus("COMPLETED")).toBe("success");
    expect(mapChainflipStatus("FAILED")).toBe("failed");
    expect(mapChainflipStatus("WAITING")).toBe("running");
    expect(mapChainflipStatus("SWAPPING")).toBe("running");
    expect(mapChainflipStatus("SENDING")).toBe("running");
  });
});
