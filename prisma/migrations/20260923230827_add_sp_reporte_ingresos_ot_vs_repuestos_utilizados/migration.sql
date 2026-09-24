DROP PROCEDURE IF EXISTS sp_reporte_ingresos_ot_vs_repuestos_utilizados;

CREATE PROCEDURE sp_reporte_ingresos_ot_vs_repuestos_utilizados(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_total_ordenes INT DEFAULT 0;

    -- ========================================================
    -- VALIDACIONES
    -- ========================================================

    -- Excepción 1: Campos obligatorios incompletos
    IF p_fecha_inicio IS NULL OR p_fecha_fin IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar tanto la fecha de inicio como la de fin.';
    END IF;

    -- Excepción 2: Rango cronológico incongruente
    IF p_fecha_inicio > p_fecha_fin THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: La fecha de inicio no puede ser posterior a la fecha de fin.';
    END IF;

    -- Excepción 3: Validar existencia de órdenes entregadas en el rango
    SELECT COUNT(*)
    INTO v_total_ordenes
    FROM ordenes_de_trabajo ot
    WHERE ot.estado = 'Entregado'
      AND DATE(ot.fecha_entrega_real) >= p_fecha_inicio
      AND DATE(ot.fecha_entrega_real) <= p_fecha_fin;

    IF v_total_ordenes = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No hay datos suficientes para generar el gráfico en este periodo.';
    END IF;

    -- ========================================================
    -- CONSULTA: INGRESOS POR OT v/s COSTO DE REPUESTOS
    -- ========================================================
    SELECT 
        DATE(ot.fecha_entrega_real) AS fecha,
        COALESCE(SUM(ot.monto_neto), 0) AS total_ingresos_ot,
        COALESCE(SUM(costos.costo_repuestos_orden), 0) AS total_costo_repuestos
    FROM ordenes_de_trabajo ot
    LEFT JOIN (
        SELECT 
            lot.id_orden_de_trabajo,
            SUM(lot.cantidad * lot.costo_unitario) AS costo_repuestos_orden
        FROM lineas_de_orden_de_trabajo lot
        WHERE lot.id_producto IS NOT NULL
        GROUP BY lot.id_orden_de_trabajo
    ) costos ON costos.id_orden_de_trabajo = ot.id_orden_de_trabajo
    WHERE ot.estado = 'Entregado'
      AND DATE(ot.fecha_entrega_real) >= p_fecha_inicio
      AND DATE(ot.fecha_entrega_real) <= p_fecha_fin
    GROUP BY DATE(ot.fecha_entrega_real)
    ORDER BY fecha ASC;

END;