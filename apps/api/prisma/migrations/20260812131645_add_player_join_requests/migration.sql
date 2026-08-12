-- CreateEnum
CREATE TYPE "PlayerJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "player_join_requests" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "status" "PlayerJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "playerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_join_requests_status_idx" ON "player_join_requests"("status");

-- CreateIndex
CREATE INDEX "player_join_requests_memberId_idx" ON "player_join_requests"("memberId");

-- AddForeignKey
ALTER TABLE "player_join_requests" ADD CONSTRAINT "player_join_requests_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_join_requests" ADD CONSTRAINT "player_join_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "club_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_join_requests" ADD CONSTRAINT "player_join_requests_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
