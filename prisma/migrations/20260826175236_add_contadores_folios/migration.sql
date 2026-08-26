/*
  Warnings:

  - A unique constraint covering the columns `[rut_emisor,tipo_dte,numero_folio]` on the table `documentos_tributarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `documentos_tributarios` MODIFY `tipo_dte` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `referencias_dte` MODIFY `codigo_referencia` SMALLINT UNSIGNED NOT NULL;

-- CreateTable
CREATE TABLE `contadores_folios` (
    `id_contador` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo_dte` INTEGER UNSIGNED NOT NULL,
    `ultimo_folio` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `actualizado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `contadores_folios_tipo_dte_key`(`tipo_dte`),
    PRIMARY KEY (`id_contador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `documentos_tributarios_rut_emisor_tipo_dte_numero_folio_key` ON `documentos_tributarios`(`rut_emisor`, `tipo_dte`, `numero_folio`);
