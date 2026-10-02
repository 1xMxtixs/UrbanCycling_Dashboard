DROP PROCEDURE IF EXISTS sp_reporte_metodo_pago;

CREATE PROCEDURE sp_reporte_metodo_pago(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_total_pagos INT DEFAULT 0;
    DECLARE v_monto_global DECIMAL(14, 2) DEFAULT 0.00;

    -- ========================================================
    -- VALIDACIONES (Contrato: SIGNAL SQLSTATE '45000')
    -- ========================================================

    -- Excepción 1: No se ingresan ambas fechas requeridas
    IF p_fecha_inicio IS NULL OR p_fecha_fin IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar tanto la fecha de inicio como la de fin.';
    END IF;

    -- Validación de consistencia cronológica
    IF p_fecha_inicio > p_fecha_fin THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: La fecha de inicio no puede ser posterior a la fecha de fin.';
    END IF;

    -- Conteo y suma global previa para verificar si existen pagos en el período
    SELECT 
        COUNT(p.id_pago),
        COALESCE(SUM(p.monto), 0)
    INTO 
        v_total_pagos,
        v_monto_global
    FROM pagos p
    WHERE p.estado = 'COMPLETADO'
      AND p.fecha_registro >= p_fecha_inicio
      AND p.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY);

    -- Excepción 2: No existen pagos registrados en el rango especificado
    IF v_total_pagos = 0 OR v_monto_global = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existen pagos registrados en el rango especificado.';
    END IF;

    -- ========================================================
    -- RESULTADO: DISTRIBUCIÓN ESTADÍSTICA POR MÉTODO DE PAGO
    -- ========================================================
    SELECT 
        mp.codigo AS codigo_metodo_pago,
        mp.nombre AS nombre_metodo_pago,
        COUNT(p.id_pago) AS cantidad_transacciones,
        SUM(p.monto) AS monto_total_recaudado,
        ROUND((SUM(p.monto) / v_monto_global) * 100, 2) AS porcentaje_del_total
    FROM pagos p
    INNER JOIN metodos_pago mp ON mp.codigo = p.metodo_pago
    WHERE p.estado = 'COMPLETADO'
      AND p.fecha_registro >= p_fecha_inicio
      AND p.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
    GROUP BY mp.codigo, mp.nombre
    ORDER BY monto_total_recaudado DESC;

END;