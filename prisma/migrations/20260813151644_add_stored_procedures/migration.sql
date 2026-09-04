-- =============================================
-- STORED PROCEDURES DE URBAN CYCLING
-- =============================================

-- =============================================
-- Aclaración de atributos
-- =============================================
-- DE TABLA "lineas_de_orden_de_trabajo"
-- precio_unitario: precio por unidad de cada producto o servicio
-- descuento_unitario: descuento aplicada a cada unidad de producto o servicio
-- =============================================
-- DE TABLA "ordenes_de_trabajo"
-- monto_subtotal: suma de los precios unitarios de todos los productos y servicios
-- descuento_productos_servicios: suma de los descuentos unitarios de todos los productos y servicios
-- descuento_global: descuento aplicado a toda la orden de trabajo
-- monto_total: monto final a pagar por la orden de trabajo.
-- monto_neto: monto total sin incluir el IVA
-- monto_iva: monto del IVA aplicado a la orden de trabajo
-- =============================================

DROP PROCEDURE IF EXISTS sp_calcular_total_orden_de_trabajo;

CREATE PROCEDURE sp_calcular_total_orden_de_trabajo(
    IN p_id_orden_de_trabajo INT UNSIGNED,
    IN p_tasa_iva DECIMAL(5,4),
    OUT p_monto_total DECIMAL(12,0)
)
BEGIN
    -- declaración de variables locales
    DECLARE v_subtotal DECIMAL(12,0) DEFAULT 0;
    DECLARE v_descuento_prod DECIMAL(12,0) DEFAULT 0;
    DECLARE v_descuento_global DECIMAL(12,0) DEFAULT 0;
    DECLARE v_total DECIMAL(12,0) DEFAULT 0;
    DECLARE v_neto DECIMAL(12,0) DEFAULT 0;
    DECLARE  v_iva DECIMAL(12,0) DEFAULT 0;
    DECLARE v_existe_ot INT DEFAULT 0;

    -- Validaciones de parámetros
    IF p_id_orden_de_trabajo IS NULL THEN
        SIGNAL SQLSTATE  '45000'
            SET MESSAGE_TEXT = 'El ID de la orden de trabajo no puede ser nulo';
    END IF;

    IF p_tasa_iva IS NULL OR p_tasa_iva < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La tasa de IVA no puede ser nula ni negativa';
    END IF;

    -- validar que exista la orden de trabajo y traer descuento global
    SELECT 1, COALESCE(descuento_global, 0)
    INTO v_existe_ot, v_descuento_global
    FROM ordenes_de_trabajo
    WHERE id_orden_de_trabajo = p_id_orden_de_trabajo
    FOR UPDATE;

    IF v_existe_ot = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Orden de trabajo no encontrada';
    END IF;

    -- calcular subtotal bruto y total de descuentos
    SELECT 
        COALESCE(SUM(cantidad * precio_unitario), 0),
        COALESCE(SUM(cantidad * descuento_unitario),0)
    INTO 
        v_subtotal,
        v_descuento_prod
    FROM lineas_de_orden_de_trabajo
    WHERE id_orden_de_trabajo = p_id_orden_de_trabajo;

    -- validacion para evitar totales negativos
    IF (v_descuento_prod + v_descuento_global) > v_subtotal THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El descuento total aplicado supera el subtotal de la orden de trabajo';
    END IF;

    -- calcular total y desglose iva
    -- total = subtotal - descuentos
    SET v_total = v_subtotal - v_descuento_prod - v_descuento_global;

    IF p_tasa_iva = 0 THEN
        SET v_neto = v_total;
        SET v_iva = 0;
    ELSE
        SET v_neto = ROUND(v_total / (1.0 + p_tasa_iva), 0);
        SET v_iva = v_total - v_neto;
    END IF;

    -- actualizar valores
    UPDATE ordenes_de_trabajo
    SET 
        monto_subtotal = v_subtotal,
        descuento_productos_servicios = v_descuento_prod,
        monto_neto = v_neto,
        monto_iva = v_iva,
        monto_total = v_total
    WHERE id_orden_de_trabajo = p_id_orden_de_trabajo;

    -- devolver el monto total calculado
    SET p_monto_total = v_total;

END;


