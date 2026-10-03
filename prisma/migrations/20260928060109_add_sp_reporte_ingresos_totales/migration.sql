DROP PROCEDURE IF EXISTS sp_reporte_ingresos_totales;

CREATE PROCEDURE sp_reporte_ingresos_totales(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_total_registros INT DEFAULT 0;

    -- ========================================================
    -- VALIDACIONES (Contrato: SIGNAL SQLSTATE '45000')
    -- ========================================================

    -- Excepción 1: Rango de fechas no ingresado o incompleto
    IF p_fecha_inicio IS NULL OR p_fecha_fin IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar tanto la fecha de inicio como la de fin.';
    END IF;

    -- Excepción 2: La fecha de inicio es posterior a la fecha de fin
    IF p_fecha_inicio > p_fecha_fin THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: La fecha de inicio no puede ser posterior a la fecha de fin.';
    END IF;

    -- Conteo previo para verificar si existen ingresos válidos en el período
    SELECT COUNT(*)
    INTO v_total_registros
    FROM ventas v
    LEFT JOIN ventas_en_mostrador vm ON vm.id_venta = v.id_venta
    LEFT JOIN ordenes_de_trabajo ot ON ot.id_venta = v.id_venta
    WHERE v.estado_pago IN ('PAGADA', 'PARCIAL')
      AND (
          (vm.id_venta_en_mostrador IS NOT NULL AND vm.estado = 'COMPLETADA')
          OR
          (ot.id_orden_de_trabajo IS NOT NULL AND ot.estado = 'ENTREGADO')
      )
      AND v.fecha_registro >= p_fecha_inicio
      AND v.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY);

    -- Excepción 3: No existen ingresos en el rango especificado
    IF v_total_registros = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existen ingresos en el rango especificado.';
    END IF;

    -- ========================================================
    -- CONSULTA: CONSOLIDADO DE INGRESOS POR PERÍODO
    -- ========================================================
    SELECT 
        DATE(v.fecha_registro) AS fecha,
        COALESCE(SUM(CASE WHEN vm.id_venta_en_mostrador IS NOT NULL THEN vm.monto_total ELSE 0 END), 0) AS ingresos_ventas_mostrador,
        COALESCE(SUM(CASE WHEN ot.id_orden_de_trabajo IS NOT NULL THEN ot.monto_total ELSE 0 END), 0) AS ingresos_ordenes_trabajo,
        COALESCE(SUM(COALESCE(vm.monto_total, ot.monto_total, 0)), 0) AS total_ingresos_dia
    FROM ventas v
    LEFT JOIN ventas_en_mostrador vm ON vm.id_venta = v.id_venta AND vm.estado = 'COMPLETADA'
    LEFT JOIN ordenes_de_trabajo ot ON ot.id_venta = v.id_venta AND ot.estado = 'ENTREGADO'
    WHERE v.estado_pago IN ('PAGADA', 'PARCIAL')
      AND (vm.id_venta_en_mostrador IS NOT NULL OR ot.id_orden_de_trabajo IS NOT NULL)
      AND v.fecha_registro >= p_fecha_inicio
      AND v.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
    GROUP BY DATE(v.fecha_registro)
    ORDER BY fecha ASC;

END;