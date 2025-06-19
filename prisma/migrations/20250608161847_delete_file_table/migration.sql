/*
  Warnings:

  - You are about to drop the column `isRoot` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Folder` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `Folder` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to alter the column `username` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userId_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "isRoot",
DROP COLUMN "size",
ALTER COLUMN "name" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET DATA TYPE VARCHAR(20);

-- DropTable
DROP TABLE "File";
