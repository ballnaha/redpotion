-- CreateEnum
CREATE TYPE "PromptPayType" AS ENUM ('PHONE_NUMBER', 'CITIZEN_ID');

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "DeliveryAddress" ADD COLUMN     "locationAddress" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "acceptCash" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptTransfer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promptpayId" TEXT,
ADD COLUMN     "promptpayName" TEXT,
ADD COLUMN     "promptpayType" "PromptPayType";
