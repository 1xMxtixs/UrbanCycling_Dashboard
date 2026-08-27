DROP PROCEDURE IF EXISTS sp_descontar_stock_productos;

CREATE PROCEDURE sp_descontar_stock_productos(
    IN p_items_json JSON
)
BEGIN
    -- declaración variables
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_id_producto INT UNSIGNED;
    DECLARE v_cantidad_a_descontar INT UNSIGNED;
    DECLARE v_id_linea_de_venta INT UNSIGNED;
    DECLARE v_id_linea_de_ot INT UNSIGNED;

    DECLARE v_stock_actual INT UNSIGNED;
    DECLARE v_costo_promedio DECIMAL(12,4);

    -- declaracion cursor para recorrer JSON
    DECLARE cursor_items CURSOR FOR
        SELECT
            jt.id_producto,
            jt.cantidad,
            jt.id_linea_de_venta,
            jt.id_linea_de_ot
        FROM JSON_TABLE(
            p_items_json,
            '$[*]' COLUMNS (
                id_producto INT UNSIGNED PATH '$.idProducto',
                cantidad INT UNSIGNED PATH '$.cantidad',
                id_linea_de_venta INT UNSIGNED PATH '$.idLineaDeVenta',
                id_linea_de_ot INT UNSIGNED PATH '$.idLineaDeOrdenDeTrabajo'
            )
        ) AS jt;

    -- declaracion de handler para el loop
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    -- declaración de handler para errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- se recorre el cursor
    OPEN cursor_items;

    read_loop: LOOP
        FETCH cursor_items INTO
            v_id_producto,
            v_cantidad_a_descontar,
            v_id_linea_de_venta,
            v_id_linea_de_ot;

        -- condicional
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        SET v_stock_actual = NULL;
        SET v_costo_promedio = NULL;

        -- bloquear stock
        SELECT stock_actual, costo_promedio
        INTO v_stock_actual, v_costo_promedio
        FROM productos
        WHERE id_producto = v_id_producto
        FOR UPDATE;
        
        -- validar stock suficiente
        IF v_stock_actual IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Producto no encontrado';
        END IF;

        SET v_done = FALSE;

        IF v_stock_actual < v_cantidad_a_descontar THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Stock insuficiente para el producto solicitado';
        END IF;

        -- actualizar valores en tabla
        UPDATE productos
        SET stock_actual = stock_actual - v_cantidad_a_descontar
        WHERE id_producto = v_id_producto;

        -- registrar salida en movimientos de inventario
        INSERT INTO movimientos_inventario (
            id_linea_de_venta,
            id_linea_de_orden_de_trabajo,
            fecha_registro,
            tipo_movimiento,
            cantidad,
            costo_unitario
        ) VALUES (
            v_id_linea_de_venta,
            v_id_linea_de_ot,
            NOW(),
            'SALIDA',
            v_cantidad_a_descontar,
            v_costo_promedio
        );

    END LOOP;

    CLOSE cursor_items;

    COMMIT;

    SELECT TRUE AS success;

END;