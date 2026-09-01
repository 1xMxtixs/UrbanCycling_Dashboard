-- traer datos de documentos_tributarios a contadores_folios
INSERT INTO contadores_folios (rut_emisor, tipo_dte, ultimo_folio, actualizado_en)
SELECT 
    rut_emisor,
    tipo_dte,
    COALESCE(MAX(numero_folio), 0) AS ultimo_folio,
    NOW() AS actualizado_en
FROM documentos_tributarios
WHERE rut_emisor IS NOT NULL AND TRIM(rut_emisor) <> ''
GROUP BY rut_emisor, tipo_dte
ON DUPLICATE KEY UPDATE
    ultimo_folio = VALUES(ultimo_folio),
    actualizado_en = NOW();


-- inicio SP
DROP PROCEDURE IF EXISTS sp_obtener_siguiente_folio;

CREATE PROCEDURE sp_obtener_siguiente_folio (
    IN p_rut_emisor VARCHAR(12),
    IN p_tipo_dte INT UNSIGNED

)
BEGIN
    IF p_rut_emisor IS NULL OR TRIM(p_rut_emisor) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El RUT emisor no puede ser nulo o vacío';
    END IF;

    IF p_tipo_dte IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El tipo DTE no puede ser nulo';
    END IF;

    INSERT INTO contadores_folios (rut_emisor, tipo_dte, ultimo_folio, actualizado_en)
    VALUES (TRIM(p_rut_emisor), p_tipo_dte, (@siguiente_folio := 1), NOW())
    ON DUPLICATE KEY UPDATE
        ultimo_folio = (@siguiente_folio := ultimo_folio + 1),
        actualizado_en = NOW();

    SELECT @siguiente_folio AS siguiente_folio;
END;
