-- CreateTable
CREATE TABLE "club_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "birthYear" INTEGER,
    "coach" TEXT,
    "assistant" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add new columns to players
ALTER TABLE "players"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "clubCategoryId" TEXT;

-- AlterTable: change photoUrl to TEXT to support base64
ALTER TABLE "players" ALTER COLUMN "photoUrl" TYPE TEXT;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_clubCategoryId_fkey"
  FOREIGN KEY ("clubCategoryId") REFERENCES "club_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
