/*
  Warnings:

  - You are about to drop the column `currentAddress` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `currentLatitude` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `currentLocationName` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `currentLongitude` on the `CustomerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomerProfile" DROP COLUMN "currentAddress",
DROP COLUMN "currentLatitude",
DROP COLUMN "currentLocationName",
DROP COLUMN "currentLongitude",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "selectedAddressType" "AddressType";
