DROP PROCEDURE IF EXISTS sp_reporte_diario_ventas;

CREATE PROCEDURE sp_reporte_diario_ventas(
    IN p_fecha DATE
)
BEGIN
    DECLARE v_total_ventas INT DEFAULT 0;

    -- ========================================================
    -- VALIDACIONES (Contrato: SIGNAL SQLSTATE '45000')
    -- ========================================================

    -- Validación parámetro nulo
    IF p_fecha IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar una fecha para generar el reporte diario.';
    END IF;

    -- Conteo previo para verificar si existieron ventas en la jornada
    SELECT COUNT(v.id_venta)
    INTO v_total_ventas
    FROM ventas v
    LEFT JOIN ventas_en_mostrador vm ON vm.id_venta = v.id_venta
    LEFT JOIN ordenes_de_trabajo ot ON ot.id_venta = v.id_venta
    WHERE v.estado_pago IN ('PAGADA', 'PARCIAL')
      AND (
          (vm.id_venta_en_mostrador IS NOT NULL AND vm.estado = 'COMPLETADA')
          OR
          (ot.id_orden_de_trabajo IS NOT NULL AND ot.estado = 'ENTREGADO')
      )
      AND v.fecha_registro >= p_fecha
      AND v.fecha_registro < DATE_ADD(p_fecha, INTERVAL 1 DAY);

    -- Excepción 1: Sin ventas en la jornada
    IF v_total_ventas = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se registraron ventas en la jornada seleccionada.';
    END IF;

    -- ========================================================
    -- RESULTADO: DETALLE DE CADA VENTA DE LA JORNADA
    -- ========================================================
    SELECT 
        v.id_venta,
        TIME(v.fecha_registro) AS hora_registro,
        CASE 
            WHEN vm.id_venta_en_mostrador IS NOT NULL THEN 'Venta Mostrador'
            WHEN ot.id_orden_de_trabajo IS NOT NULL THEN 'Orden de Trabajo'
            ELSE 'Otro'
        END AS tipo_operacion,
        COALESCE(ot.id_orden_de_trabajo, vm.id_venta_en_mostrador) AS identificador_operacion,
        COALESCE(CONCAT(c.primer_nombre, ' ', c.apellido_paterno), c.razon_social, 'Cliente General') AS cliente,
        v.estado_pago,
        COALESCE(vm.monto_total, ot.monto_total, 0) AS monto_total_venta
    FROM ventas v
    LEFT JOIN ventas_en_mostrador vm ON vm.id_venta = v.id_venta AND vm.estado = 'COMPLETADA'
    LEFT JOIN ordenes_de_trabajo ot ON ot.id_venta = v.id_venta AND ot.estado = 'ENTREGADO'
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    WHERE v.estado_pago IN ('PAGADA', 'PARCIAL')
      AND (vm.id_venta_en_mostrador IS NOT NULL OR ot.id_orden_de_trabajo IS NOT NULL)
      AND v.fecha_registro >= p_fecha
      AND v.fecha_registro < DATE_ADD(p_fecha, INTERVAL 1 DAY)
    ORDER BY v.fecha_registro ASC;

END;