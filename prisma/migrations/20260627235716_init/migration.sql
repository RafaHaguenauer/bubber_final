/*
  Warnings:

  - You are about to drop the `drivers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rides" DROP CONSTRAINT "rides_driverId_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_driverId_fkey";

-- AlterTable
ALTER TABLE "driver_replicas" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

-- DropTable
DROP TABLE "drivers";

-- DropTable
DROP TABLE "vehicles";
