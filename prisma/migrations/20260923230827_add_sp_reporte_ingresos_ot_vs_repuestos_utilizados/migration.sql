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
    IF p_fecha_inicio IS NULL OR p_fecha_fin IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar tanto la fecha de inicio como la de fin.';
    END IF;

    IF p_fecha_inicio > p_fecha_fin THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: La fecha de inicio no puede ser posterior a la fecha de fin.';
    END IF;

    SELECT COUNT(*)
    INTO v_total_ordenes
    FROM ordenes_de_trabajo ot
    INNER JOIN ventas v ON v.id_venta = ot.id_venta
    WHERE ot.estado = 'COMPLETADA' -- Ajustar al string exacto de tu sistema (ej: 'COMPLETADA', 'FINALIZADA')
      AND DATE(v.fecha_registro) >= p_fecha_inicio
      AND DATE(v.fecha_registro) <= p_fecha_fin;

    IF v_total_ordenes = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No hay datos suficientes para generar el gráfico en este periodo.';
    END IF;

    -- ========================================================
    -- CONSULTA COMPARATIVA: TOTAL OT v/s COSTO DE REPUESTOS
    -- ========================================================
    SELECT 
        DATE(v.fecha_registro) AS fecha,

        -- 1. Total cobrado por órdenes de trabajo completadas (monto neto sin IVA o monto total)
        COALESCE(SUM(ot.monto_neto), 0) AS total_ingresos_ot,

        -- 2. Costo real de los repuestos consumidos en esas órdenes completadas
        COALESCE(SUM(costos.costo_repuestos_orden), 0) AS total_costo_repuestos

    FROM ventas v
    INNER JOIN ordenes_de_trabajo ot 
        ON ot.id_venta = v.id_venta
    LEFT JOIN (
        -- Subconsulta para sumar insumos agrupados por orden sin duplicar cabeceras
        SELECT 
            lot.id_orden_de_trabajo,
            SUM(lot.cantidad * lot.costo_unitario) AS costo_repuestos_orden
        FROM lineas_de_orden_de_trabajo lot
        WHERE lot.id_producto IS NOT NULL
        GROUP BY lot.id_orden_de_trabajo
    ) costos ON costos.id_orden_de_trabajo = ot.id_orden_de_trabajo
    WHERE ot.estado = 'COMPLETADA'
      AND DATE(v.fecha_registro) >= p_fecha_inicio
      AND DATE(v.fecha_registro) <= p_fecha_fin
    GROUP BY DATE(v.fecha_registro)
    ORDER BY fecha ASC;

END;