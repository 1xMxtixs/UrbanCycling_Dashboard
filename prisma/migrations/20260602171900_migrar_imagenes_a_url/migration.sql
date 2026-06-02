/*
  Warnings:

  - You are about to drop the column `archivo` on the `imagenes_producto` table. All the data in the column will be lost.
  - Added the required column `url` to the `imagenes_producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `imagenes_producto` DROP COLUMN `archivo`,
    ADD COLUMN `url` VARCHAR(512) NOT NULL;
