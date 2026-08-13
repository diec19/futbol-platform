-- CreateTable
CREATE TABLE "unlink_requests" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "PlayerJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "setActive" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unlink_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unlink_requests_status_idx" ON "unlink_requests"("status");

-- CreateIndex
CREATE INDEX "unlink_requests_memberId_idx" ON "unlink_requests"("memberId");

-- AddForeignKey
ALTER TABLE "unlink_requests" ADD CONSTRAINT "unlink_requests_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlink_requests" ADD CONSTRAINT "unlink_requests_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
