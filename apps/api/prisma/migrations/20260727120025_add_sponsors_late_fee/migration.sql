-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "player_subscriptions" ADD COLUMN     "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_plans" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyAmount" DOUBLE PRECISION NOT NULL,
    "durationMonths" INTEGER NOT NULL DEFAULT 6,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorships" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorship_payments" (
    "id" TEXT NOT NULL,
    "sponsorshipId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "mpPreferenceId" TEXT,
    "mpPaymentLink" TEXT,
    "mpPaymentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsorship_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sponsorship_payments_sponsorshipId_month_year_key" ON "sponsorship_payments"("sponsorshipId", "month", "year");

-- AddForeignKey
ALTER TABLE "sponsor_plans" ADD CONSTRAINT "sponsor_plans_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_planId_fkey" FOREIGN KEY ("planId") REFERENCES "sponsor_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_payments" ADD CONSTRAINT "sponsorship_payments_sponsorshipId_fkey" FOREIGN KEY ("sponsorshipId") REFERENCES "sponsorships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
