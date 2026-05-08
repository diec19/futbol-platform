-- AlterTable: make teamId nullable on players
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_teamId_dni_key";
ALTER TABLE "players" ALTER COLUMN "teamId" DROP NOT NULL;

-- Add unique constraint on dni
ALTER TABLE "players" ADD CONSTRAINT "players_dni_key" UNIQUE ("dni");

-- Update foreign key to use SET NULL on delete
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_teamId_fkey";
ALTER TABLE "players" ADD CONSTRAINT "players_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
