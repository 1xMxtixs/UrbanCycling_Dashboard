DROP PROCEDURE IF EXISTS sp_descontar_stock_productos;

CREATE PROCEDURE sp_descontar_stock_productos(
    IN p_items_json JSON
)
BEGIN
    -- declaración variables
    DECLARE v_done INT DEFAULT false;
    DECLARE v_id_producto INT UNSIGNED;
    DECLARE v_cantidad_a_descontar INT UNSIGNED;
    DECLARE v_stock_actual INT UNSIGNED;
    DECLARE v_nombre_producto VARCHAR(100);

    -- declaracion cursor para recorrer JSON
    DECLARE cursor_items CURSOR FOR
        SELECT
            jt.id_producto,
            jt.cantidad
        FROM JSON_TABLE(
            p_items_json,
            '$[*]' COLUMNS (
                id_producto INT UNSIGNED PATH '$.idProducto',
                cantidad INT UNSIGNED PATH '$.cantidad'
            )
        ) AS jt;

    -- declaracion de handler para el loop
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    -- declaración de handler para errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        RESIGNAL;
    END;
    
    -- se recorre el cursor
    OPEN cursor_items;

    read_loop: LOOP
        FETCH cursor_items INTO v_id_producto, v_cantidad_a_descontar;

        -- condicional
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- bloquear stock
        SELECT stock_actual, nombre
        INTO v_stock_actual, v_nombre_producto
        FROM productos
        WHERE id_producto = v_id_producto
        FOR UPDATE;
        
        -- validar stock suficiente
        IF v_stock_actual IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Producto no encontrado';
        ELSEIF v_stock_actual < v_cantidad_a_descontar THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock insuficiente para el producto solicitado';
        END IF;

        -- actualizar valores en tabla
        UPDATE productos
        SET stock_actual = stock_actual - v_cantidad_a_descontar
        WHERE id_producto = v_id_producto;

    END LOOP;

    CLOSE cursor_items;

    SELECT TRUE AS success;

END;