/*
  Warnings:

  - You are about to drop the `TelefonoCliente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `TelefonoCliente` DROP FOREIGN KEY `TelefonoCliente_id_cliente_fkey`;

-- DropTable
DROP TABLE `TelefonoCliente`;

-- CreateTable
CREATE TABLE `telefonos_clientes` (
    `id_telefono_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_telefono_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `correos_clientes` (
    `id_correo_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `correo` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    UNIQUE INDEX `correos_clientes_correo_key`(`correo`),
    PRIMARY KEY (`id_correo_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `telefonos_clientes` ADD CONSTRAINT `telefonos_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `correos_clientes` ADD CONSTRAINT `correos_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;
