DROP PROCEDURE IF EXISTS sp_reporte_diario_ventas;

CREATE PROCEDURE sp_reporte_diario_ventas(
    IN p_fecha DATE
)

BEGIN
    DECLARE v_inicio_dia TIMESTAMP;
    DECLARE v_fin_dia TIMESTAMP;

    SET v_inicio_dia = TIMESTAMP(p_fecha, '00:00:00');
    SET v_fin_dia = TIMESTAMP(p_fecha, '23:59:59');

    SELECT 
        p_fecha AS fecha,
        COUNT(v.id_venta) AS cantidad_ventas,
        COALESCE(SUM(COALESCE(vm.monto_total, ot.monto_total, 0)),0) AS total_ingresos,
        COALESCE(SUM(CASE
                        WHEN vm.id_venta_en_mostrador IS NOT NULL THEN vm.monto_total 
                        ELSE 0
                     END), 0) AS total_mostrador,
        COALESCE(SUM(CASE
                        WHEN ot.id_orden_de_trabajo IS NOT NULL THEN ot.monto_total
                        ELSE 0
                     END), 0) AS total_ordenes
    FROM ventas v
    LEFT JOIN ventas_en_mostrador vm ON v.id_venta = vm.id_venta
    LEFT JOIN ordenes_de_trabajo ot ON v.id_venta = ot.id_venta
    WHERE v.fecha_registro BETWEEN v_inicio_dia AND v_fin_dia;

END;