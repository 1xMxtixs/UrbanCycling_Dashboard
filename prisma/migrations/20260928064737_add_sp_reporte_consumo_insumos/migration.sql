DROP PROCEDURE IF EXISTS sp_reporte_consumo_insumos;

CREATE PROCEDURE sp_reporte_consumo_insumos(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_total_consumos INT DEFAULT 0;

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

    -- Conteo previo para verificar si existen consumos en el período
    SELECT COUNT(*)
    INTO v_total_consumos
    FROM lineas_de_orden_de_trabajo lot
    INNER JOIN ordenes_de_trabajo ot ON ot.id_orden_de_trabajo = lot.id_orden_de_trabajo
    WHERE lot.id_producto IS NOT NULL
      AND ot.estado = 'ENTREGADO'
      AND ot.fecha_entrega_real >= p_fecha_inicio
      AND ot.fecha_entrega_real < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY);

    -- Excepción 3: No existen registros de consumo de insumos en el período especificado
    IF v_total_consumos = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existen registros de consumo de insumos en el período especificado.';
    END IF;

    -- ========================================================
    -- RESULTADO: DETALLE DE CONSUMO DE INSUMOS Y PRODUCTOS
    -- ========================================================
    SELECT 
        p.id_producto,
        p.nombre AS nombre_producto,
        p.tipo_producto,
        SUM(lot.cantidad) AS cantidad_total_utilizada,
        COUNT(DISTINCT ot.id_orden_de_trabajo) AS total_ordenes_asociadas,
        GROUP_CONCAT(DISTINCT ot.id_orden_de_trabajo ORDER BY ot.id_orden_de_trabajo ASC SEPARATOR ', ') AS ordenes_asociadas,
        SUM(lot.cantidad * lot.costo_unitario) AS costo_total_consumo
    FROM lineas_de_orden_de_trabajo lot
    INNER JOIN ordenes_de_trabajo ot ON ot.id_orden_de_trabajo = lot.id_orden_de_trabajo
    INNER JOIN productos p ON p.id_producto = lot.id_producto
    WHERE ot.estado = 'ENTREGADO'
      AND ot.fecha_entrega_real >= p_fecha_inicio
      AND ot.fecha_entrega_real < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
    GROUP BY p.id_producto, p.nombre, p.tipo_producto
    ORDER BY cantidad_total_utilizada DESC;

END;