/*
  Warnings:

  - A unique constraint covering the columns `[correo]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `usuarios_correo_key` ON `usuarios`(`correo`);
