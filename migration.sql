/*
  Warnings:

  - Added the required column `userid` to the `Items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "userid" TEXT NOT NULL,
ALTER COLUMN "itemstatus" SET DEFAULT 'ELADO';

-- AddForeignKey
ALTER TABLE "Items" ADD CONSTRAINT "Items_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Items" ADD CONSTRAINT "Items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
