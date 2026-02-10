-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ELADO', 'ELADVA', 'NEM_ELERHETO');

-- CreateTable
CREATE TABLE "Items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "itemstatus" "ItemStatus" NOT NULL,

    CONSTRAINT "Items_pkey" PRIMARY KEY ("id")
);
