-- CreateTable
CREATE TABLE `direcciones_clientes` (
    `id_direccion_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `region` VARCHAR(50) NOT NULL,
    `ciudad` VARCHAR(50) NOT NULL,
    `comuna` VARCHAR(50) NOT NULL,
    `calle` VARCHAR(150) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `unidad` VARCHAR(20) NULL,

    PRIMARY KEY (`id_direccion_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `direcciones_clientes` ADD CONSTRAINT `direcciones_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;
