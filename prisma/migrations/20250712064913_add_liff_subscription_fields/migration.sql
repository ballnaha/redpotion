-- CreateEnum
CREATE TYPE "PaymentSlipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('FREE', 'MONTHLY', 'YEARLY', 'LIFETIME', 'TRIAL');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lineUserId" TEXT,
ADD COLUMN     "promoCode" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "isLiffActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "liffExpiresAt" TIMESTAMP(3),
ADD COLUMN     "liffSettings" JSONB,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionType" "SubscriptionType" DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- CreateTable
CREATE TABLE "PaymentSlip" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "slipImageUrl" TEXT NOT NULL,
    "transferAmount" DOUBLE PRECISION NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "transferReference" TEXT,
    "accountName" TEXT NOT NULL,
    "status" "PaymentSlipStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSlip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentSlip" ADD CONSTRAINT "PaymentSlip_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
