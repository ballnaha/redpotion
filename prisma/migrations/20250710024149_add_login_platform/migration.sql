-- CreateEnum
CREATE TYPE "LoginPlatform" AS ENUM ('IOS', 'ANDROID', 'BROWSER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loginPlatform" "LoginPlatform";
