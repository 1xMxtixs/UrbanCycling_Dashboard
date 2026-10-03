DROP PROCEDURE IF EXISTS sp_reporte_diario_ventas;

CREATE PROCEDURE sp_reporte_diario_ventas(
    IN p_fecha DATE
)
BEGIN
    DECLARE v_total_ingresos INT DEFAULT 0;

    -- ========================================================
    -- VALIDACIONES (Contrato: SIGNAL SQLSTATE '45000')
    -- ========================================================

    -- 1. Validación de parámetro nulo
    IF p_fecha IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar una fecha para generar el reporte diario.';
    END IF;

    -- 2. Conteo previo para verificar si existieron ingresos en la jornada seleccionada
    SELECT COUNT(ap.id_asignacion_pago)
    INTO v_total_ingresos
    FROM pagos p
    INNER JOIN asignaciones_pago ap ON ap.id_pago = p.id_pago
    WHERE ap.id_venta IS NOT NULL
      AND p.estado = 'COMPLETADO'
      AND p.fecha_registro >= p_fecha
      AND p.fecha_registro < DATE_ADD(p_fecha, INTERVAL 1 DAY);

    -- Excepción: Sin ingresos en la jornada
    IF v_total_ingresos = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se registraron ingresos en la jornada seleccionada.';
    END IF;

    -- ========================================================
    -- RESULTADO: DETALLE DE CADA INGRESO/PAGO DE LA JORNADA
    -- ========================================================
    SELECT 
        p.id_pago,
        ap.id_asignacion_pago,
        TIME(p.fecha_registro) AS hora_pago,
        p.metodo_pago,
        ap.monto_asociado AS monto_ingresado,
        v.id_venta,
        CASE 
            WHEN vm.id_venta_en_mostrador IS NOT NULL THEN 'Venta Mostrador'
            WHEN ot.id_orden_de_trabajo IS NOT NULL THEN 'Orden de Trabajo'
            ELSE 'Otro'
        END AS tipo_operacion,
        COALESCE(ot.id_orden_de_trabajo, vm.id_venta_en_mostrador) AS identificador_operacion,
        COALESCE(CONCAT(c.primer_nombre, ' ', c.apellido_paterno), c.razon_social, 'Cliente General') AS cliente,
        v.estado_pago AS estado_pago_venta,
        COALESCE(vm.monto_total, ot.monto_total, 0) AS monto_total_operacion
    FROM pagos p
    INNER JOIN asignaciones_pago ap ON ap.id_pago = p.id_pago
    INNER JOIN ventas v ON v.id_venta = ap.id_venta
    LEFT JOIN ventas_en_mostrador vm ON vm.id_venta = v.id_venta
    LEFT JOIN ordenes_de_trabajo ot ON ot.id_venta = v.id_venta
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    WHERE ap.id_venta IS NOT NULL
      AND p.estado = 'COMPLETADO'
      AND p.fecha_registro >= p_fecha
      AND p.fecha_registro < DATE_ADD(p_fecha, INTERVAL 1 DAY)
    ORDER BY p.fecha_registro ASC;

END;