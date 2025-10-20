-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('BUNDLE', 'EARLY_BIRD', 'DISCOUNT_PERCENTAGE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "OfferItemType" AS ENUM ('ENTRY', 'BRACELET', 'VOUCHER', 'MERCHANDISE', 'SERVICE');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "OfferType" NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "originalPrice" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "discountPercentage" DECIMAL(5,2),
    "maxQuantity" INTEGER,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "maxPerUser" INTEGER DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "OfferItemType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "braceletAmount" DECIMAL(10,2),
    "voucherDiscount" DECIMAL(5,2),
    "metadata" JSONB,
    "offerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_purchases" (
    "id" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "discountAmount" DECIMAL(10,2),
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod",
    "paymentId" TEXT,
    "djangoBraceletIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activatedAt" TIMESTAMP(3),
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metadata" JSONB,
    "purchasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offers_eventId_idx" ON "offers"("eventId");

-- CreateIndex
CREATE INDEX "offers_tenantId_idx" ON "offers"("tenantId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_type_idx" ON "offers"("type");

-- CreateIndex
CREATE INDEX "offers_validFrom_validUntil_idx" ON "offers"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "offer_items_offerId_idx" ON "offer_items"("offerId");

-- CreateIndex
CREATE INDEX "offer_items_type_idx" ON "offer_items"("type");

-- CreateIndex
CREATE INDEX "offer_purchases_offerId_idx" ON "offer_purchases"("offerId");

-- CreateIndex
CREATE INDEX "offer_purchases_userId_idx" ON "offer_purchases"("userId");

-- CreateIndex
CREATE INDEX "offer_purchases_tenantId_idx" ON "offer_purchases"("tenantId");

-- CreateIndex
CREATE INDEX "offer_purchases_eventId_idx" ON "offer_purchases"("eventId");

-- CreateIndex
CREATE INDEX "offer_purchases_status_idx" ON "offer_purchases"("status");

-- CreateIndex
CREATE INDEX "offer_purchases_purchasedAt_idx" ON "offer_purchases"("purchasedAt");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_items" ADD CONSTRAINT "offer_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_purchases" ADD CONSTRAINT "offer_purchases_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_purchases" ADD CONSTRAINT "offer_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_purchases" ADD CONSTRAINT "offer_purchases_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
