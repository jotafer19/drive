/*
  Warnings:

  - You are about to alter the column `name` on the `Folder` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "name" SET DATA TYPE VARCHAR(20);
