-- AlterTable
ALTER TABLE "sponsors" ADD COLUMN     "slideOrder" INTEGER,
ADD COLUMN     "slideUrl" TEXT;

-- CreateTable
CREATE TABLE "benefits" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EXTERNAL',
    "sponsorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
