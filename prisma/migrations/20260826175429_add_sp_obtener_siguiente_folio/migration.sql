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
    INSERT INTO contadores_folios (tipo_dte, ultimo_folio, actualizado_en)
    VALUES (p_tipo_dte, LAST_INSERT_ID(1), NOW())
    ON DUPLICATE KEY UPDATE
        ultimo_folio = LAST_INSERT_ID(ultimo_folio + 1),
        actualizado_en = NOW();

    SELECT LAST_INSERT_ID() AS siguiente_folio;
END;
