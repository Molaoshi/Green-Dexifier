-- CreateTable
CREATE TABLE "Swap" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "fromChain" TEXT NOT NULL,
    "fromToken" TEXT NOT NULL,
    "fromAmount" TEXT NOT NULL,
    "toChain" TEXT NOT NULL,
    "toToken" TEXT NOT NULL,
    "toAmount" TEXT,
    "depositAddress" TEXT,
    "recipientAddress" TEXT,
    "depositHash" TEXT,
    "settleHash" TEXT,
    "feeUsd" DOUBLE PRECISION,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Swap_status_idx" ON "Swap"("status");

-- CreateIndex
CREATE INDEX "Swap_createdAt_idx" ON "Swap"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Swap_provider_externalId_key" ON "Swap"("provider", "externalId");
