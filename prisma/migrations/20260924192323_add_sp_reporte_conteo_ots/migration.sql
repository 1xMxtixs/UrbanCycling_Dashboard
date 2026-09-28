DROP PROCEDURE IF EXISTS sp_reporte_conteo_ordenes_trabajo;

CREATE PROCEDURE sp_reporte_conteo_ordenes_trabajo(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_total_ordenes INT DEFAULT 0;

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

    -- Conteo previo para verificar si existen órdenes entregadas en el período
    SELECT COUNT(*)
    INTO v_total_ordenes
    FROM ordenes_de_trabajo ot
    WHERE ot.estado = 'ENTREGADO'
      AND DATE(ot.fecha_entrega_real) >= p_fecha_inicio
      AND DATE(ot.fecha_entrega_real) <= DATE_ADD(p_fecha_fin, INTERVAL 1 DAY);

    -- Excepción 3: No existen órdenes de trabajo en el período ingresado
    IF v_total_ordenes = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existen órdenes de trabajo en el período ingresado.';
    END IF;

    -- ========================================================
    -- RESULTADO: CONTEO DE ÓRDENES POR FECHA DE ENTREGA
    -- ========================================================
    SELECT 
        DATE(ot.fecha_entrega_real) AS fecha,
        COUNT(ot.id_orden_de_trabajo) AS cantidad_ordenes
    FROM ordenes_de_trabajo ot
    WHERE ot.estado = 'ENTREGADO'
      AND DATE(ot.fecha_entrega_real) >= p_fecha_inicio
      AND DATE(ot.fecha_entrega_real) <= DATE_ADD(p_fecha_fin, INTERVAL 1 DAY)
    GROUP BY DATE(ot.fecha_entrega_real)
    ORDER BY fecha ASC;

END;