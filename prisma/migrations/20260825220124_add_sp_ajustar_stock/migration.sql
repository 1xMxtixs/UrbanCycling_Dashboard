DROP PROCEDURE IF EXISTS sp_ajustar_stock;

CREATE PROCEDURE sp_ajustar_stock(
    IN p_id_producto INT UNSIGNED,
    IN p_stock_nuevo INT UNSIGNED,
    IN p_id_usuario INT UNSIGNED,
    IN p_motivo VARCHAR(50),
    IN p_observacion VARCHAR(500)
)
BEGIN
    DECLARE v_stock_anterior INT UNSIGNED;
    DECLARE v_costo_promedio DECIMAL(12,4);
    DECLARE v_diferencia INT UNSIGNED;
    DECLARE v_direccion VARCHAR(20);
    DECLARE v_id_ajuste INT UNSIGNED;
    DECLARE v_id_linea_ajuste INT UNSIGNED;

    SELECT stock_actual, costo_promedio
    INTO v_stock_anterior, v_costo_promedio
    FROM productos
    WHERE id_producto = p_id_producto
    FOR UPDATE;

    IF v_stock_anterior IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Producto no encontrado';
    END IF;

    IF p_stock_nuevo > v_stock_anterior THEN
        SET v_diferencia = p_stock_nuevo - v_stock_anterior;
        SET v_direccion = 'ENTRADA';
    ELSEIF p_stock_nuevo < v_stock_anterior THEN
        SET v_diferencia = v_stock_anterior - p_stock_nuevo;
        SET v_direccion = 'SALIDA';
    ELSE
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El nuevo stock es idéntico al stock actual. No se generó un Ajuste';
    END IF;

    INSERT INTO ajustes_inventario (
        id_usuario,
        fecha_registro,
        motivo, 
        direccion,
        observacion
    ) VALUES (
        p_id_usuario,
        NOW(),
        IFNULL(p_motivo, 'CORRECCION_STOCK'),
        v_direccion,
        p_observacion
    );
    SET v_id_ajuste = LAST_INSERT_ID();

    INSERT INTO lineas_de_ajuste (
        id_ajuste,
        id_producto,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        costo_unitario
    ) VALUES (
        v_id_ajuste,
        p_id_producto,
        v_diferencia,
        v_stock_anterior,
        p_stock_nuevo,
        v_costo_promedio
    );
    SET v_id_linea_ajuste = LAST_INSERT_ID();

    INSERT INTO movimientos_inventario (
        id_linea_de_ajuste,
        fecha_registro,
        tipo_movimiento,
        cantidad,
        costo_unitario
    ) VALUES (
        v_id_linea_ajuste,
        NOW(),
        v_direccion,
        v_diferencia,
        v_costo_promedio
    );

    UPDATE productos
    SET stock_actual = p_stock_nuevo
    WHERE id_producto = p_id_producto;

    SELECT TRUE AS success;
END;