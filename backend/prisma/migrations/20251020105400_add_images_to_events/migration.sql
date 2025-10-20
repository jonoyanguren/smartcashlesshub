-- AlterTable
ALTER TABLE "events" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
