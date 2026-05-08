CREATE TABLE "player_subscriptions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "mpPreferenceId" TEXT,
    "mpPaymentLink" TEXT,
    "mpPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_subscriptions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "player_subscriptions"
    ADD CONSTRAINT "player_subscriptions_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "player_subscriptions_playerId_month_year_key"
    ON "player_subscriptions"("playerId", "month", "year");
