-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_categoryId_fkey";

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
