DROP PROCEDURE IF EXISTS sp_reporte_productos_destacados;

CREATE PROCEDURE sp_reporte_productos_destacados(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_total_movimientos INT DEFAULT 0;

    -- ========================================================
    -- VALIDACIONES (Contrato: SIGNAL SQLSTATE '45000')
    -- ========================================================

    -- Excepción 1: No se ingresan ambas fechas requeridas
    IF p_fecha_inicio IS NULL OR p_fecha_fin IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Debe ingresar tanto la fecha de inicio como la de fin.';
    END IF;

    -- Excepción 2: La fecha de inicio es posterior a la de fin
    IF p_fecha_inicio > p_fecha_fin THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: La fecha de inicio no puede ser posterior a la fecha de fin.';
    END IF;

    -- Conteo previo para verificar si existen salidas de productos en el período
    SELECT 
        (
            SELECT COALESCE(COUNT(lv.id_linea_de_venta), 0)
            FROM lineas_de_venta lv
            INNER JOIN ventas_en_mostrador vm ON vm.id_venta_en_mostrador = lv.id_venta_en_mostrador
            INNER JOIN ventas v ON v.id_venta = vm.id_venta
            WHERE vm.estado = 'COMPLETADA'
              AND v.estado_pago IN ('PAGADA', 'PARCIAL')
              AND v.fecha_registro >= p_fecha_inicio
              AND v.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
        )
        +
        (
            SELECT COALESCE(COUNT(lot.id_linea_de_orden_de_trabajo), 0)
            FROM lineas_de_orden_de_trabajo lot
            INNER JOIN ordenes_de_trabajo ot ON ot.id_orden_de_trabajo = lot.id_orden_de_trabajo
            INNER JOIN ventas v ON v.id_venta = ot.id_venta
            WHERE lot.id_producto IS NOT NULL
              AND ot.estado = 'ENTREGADO'
              AND v.estado_pago IN ('PAGADA', 'PARCIAL')
              AND v.fecha_registro >= p_fecha_inicio
              AND v.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
        )
    INTO v_total_movimientos;

    -- Excepción 3: No existen datos suficientes para el análisis
    IF v_total_movimientos = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existen datos suficientes para el análisis en el período ingresado.';
    END IF;

    -- ========================================================
    -- RESULTADO: RANKING DE PRODUCTOS DESTACADOS
    -- ========================================================
    SELECT 
        p.id_producto,
        p.nombre AS nombre_producto,
        p.tipo_producto,
        COALESCE(SUM(mov.cantidad_mostrador), 0) AS unidades_en_mostrador,
        COALESCE(SUM(mov.cantidad_taller), 0) AS unidades_en_taller,
        SUM(mov.cantidad_total) AS total_unidades_despachadas,
        COUNT(DISTINCT mov.id_venta) AS frecuencia_operaciones,
        SUM(mov.monto_total_linea) AS total_recaudado
    FROM (
        -- Salidas vía Ventas en Mostrador
        SELECT 
            lv.id_producto,
            v.id_venta,
            lv.cantidad AS cantidad_mostrador,
            0 AS cantidad_taller,
            lv.cantidad AS cantidad_total,
            (lv.cantidad * (lv.precio_unitario - lv.descuento_unitario)) AS monto_total_linea
        FROM lineas_de_venta lv
        INNER JOIN ventas_en_mostrador vm ON vm.id_venta_en_mostrador = lv.id_venta_en_mostrador
        INNER JOIN ventas v ON v.id_venta = vm.id_venta
        WHERE vm.estado = 'COMPLETADA'
          AND v.estado_pago IN ('PAGADA', 'PARCIAL')
          AND v.fecha_registro >= p_fecha_inicio
          AND v.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)

        UNION ALL

        -- Salidas vía Órdenes de Trabajo (Taller)
        SELECT 
            lot.id_producto,
            v.id_venta,
            0 AS cantidad_mostrador,
            lot.cantidad AS cantidad_taller,
            lot.cantidad AS cantidad_total,
            (lot.cantidad * (lot.precio_unitario - lot.descuento_unitario)) AS monto_total_linea
        FROM lineas_de_orden_de_trabajo lot
        INNER JOIN ordenes_de_trabajo ot ON ot.id_orden_de_trabajo = lot.id_orden_de_trabajo
        INNER JOIN ventas v ON v.id_venta = ot.id_venta
        WHERE lot.id_producto IS NOT NULL
          AND ot.estado = 'ENTREGADO'
          AND v.estado_pago IN ('PAGADA', 'PARCIAL')
          AND v.fecha_registro >= p_fecha_inicio
          AND v.fecha_registro < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
    ) AS mov
    INNER JOIN productos p ON p.id_producto = mov.id_producto
    GROUP BY p.id_producto, p.nombre, p.tipo_producto
    ORDER BY total_unidades_despachadas DESC, frecuencia_operaciones DESC;

END;