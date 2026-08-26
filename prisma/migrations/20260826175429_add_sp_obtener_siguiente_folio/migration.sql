-- traer datos de documentos_tributarios a contadores_folios
INSERT INTO contadores_folios (tipo_dte, ultimo_folio, actualizado_en)
SELECT tipo_dte, COALESCE(MAX(numero_folio), 0), NOW()
FROM documentos_tributarios
WHERE tipo_movimiento = 'VENTA'
GROUP BY tipo_dte
ON DUPLICATE KEY UPDATE ultimo_folio = VALUES(ultimo_folio);


-- inicio SP
DROP PROCEDURE IF EXISTS sp_obtener_siguiente_folio;

CREATE PROCEDURE sp_obtener_siguiente_folio (
    IN p_tipo_dte INT UNSIGNED
)
BEGIN
    DECLARE v_folio_actual INT UNSIGNED DEFAULT 0;
    DECLARE v_siguiente_folio INT UNSIGNED DEFAULT 0;

    INSERT INTO contadores_folios (tipo_dte, ultimo_folio, actualizado_en)
    VALUES (p_tipo_dte, 0, NOW())
    ON DUPLICATE KEY UPDATE tipo_dte = tipo_dte;

    SELECT ultimo_folio
    INTO v_folio_actual
    FROM contadores_folios
    WHERE tipo_dte = p_tipo_dte
    FOR UPDATE;

    SET v_siguiente_folio = v_folio_actual + 1;

    UPDATE contadores_folios
    SET ultimo_folio = v_siguiente_folio,
        actualizado_en = NOW()
    WHERE tipo_dte = p_tipo_dte;

    SELECT v_siguiente_folio AS siguienteFolio;
END;
