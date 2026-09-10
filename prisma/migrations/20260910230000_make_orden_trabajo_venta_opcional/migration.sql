-- La Orden de Trabajo deja de depender obligatoriamente de una Venta.
-- El indice unico sobre id_venta se mantiene: MySQL permite multiples NULL en una columna unica.
ALTER TABLE `ordenes_de_trabajo` MODIFY `id_venta` INT UNSIGNED NULL;
