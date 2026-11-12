# Imágenes de bicicletas sin migraciones

El editor usa `POST /api/upload/temporales` (permiso `bicycles:update`). Los otros formularios conservan `/api/upload` y su contrato anterior. No se modifican tablas ni migraciones. Se reutiliza `auditorias` para registrar descriptores, reservas, confirmaciones, borrados pendientes y el cursor de reconciliación bajo `nombreTablaAfectada = archivos_bicicleta`.

## Guardado

1. La subida temporal valida MIME y tamaño (5 MB). El servidor genera la clave y registra el trabajo antes de escribir el archivo. Se guardan en `public/uploads/tmp/bicicletas/{usuario}/` o `tmp/bicicletas/{usuario}/` en R2.
2. Devuelve un token HMAC firmado, vinculado al usuario y con vencimiento de 24 horas, además de las URLs temporal y definitiva. La clave de almacenamiento nunca se toma del cliente.
3. El PATCH de bicicleta recibe `imagenes` para las fotos actuales conservadas e `imagenesTemporales` para los tokens nuevos. Reserva cada token durante 10 minutos y copia a la ubicación definitiva antes de escribir sus referencias.
4. Dentro de la transacción que guarda la bicicleta se confirman las reservas y se encola la limpieza de las URLs retiradas. Si falla la transacción, se intenta borrar la copia definitiva; se conserva el temporal para reintentar. Una caída del servidor deja las claves y la reserva registradas para reconciliación.
5. Tras el commit se limpian los temporales confirmados y las fotos retiradas. Nunca se borra una URL referenciada por otra bicicleta, producto o garantía.

Los borrados individuales de fotos y de bicicletas también registran su trabajo dentro de la transacción y eliminan los archivos después. Los endpoints de anulación conservan su funcionamiento y dejan además un trabajo para que la limpieza administrativa recupere sus fallos de almacenamiento.

Al cerrar el editor o quitar una nueva foto, el frontend solicita `DELETE /api/upload/temporales` con sus tokens. La petición usa `keepalive`; si se pierde la conexión, los trabajos persistidos permiten limpiar posteriormente. Un token confirmado no permite eliminar su archivo definitivo. Los reintentos del mismo token en la misma bicicleta son idempotentes. No se puede utilizar un token de otro usuario o bicicleta.

## Configuración

- Firma: `IMAGE_UPLOAD_SECRET` o, si falta, `NEXTAUTH_SECRET`/`AUTH_SECRET`. Debe ser estable y compartida entre instancias. Rotar el secreto invalida los tokens anteriores; los registros de auditoría igual permiten limpiar sus archivos.
- Almacenamiento: se conserva la detección de credenciales R2 existente, incluso en desarrollo. Sin R2 se usa almacenamiento local.
- La limpieza de pendientes se ejecuta con `POST /api/upload/limpieza` y requiere una sesión autenticada de Administrador. Se registra como actor al administrador que realiza la petición. No admite autenticación alternativa por tokens de mantenimiento.

Con el servidor iniciado, desde la consola del navegador y con sesión de Administrador:

```javascript
fetch('/api/upload/limpieza', { method: 'POST' })
  .then(async r => ({ status: r.status, data: await r.json() }))
  .then(console.log)
```

## Reconciliación y fallos

La limpieza procesa lotes acotados y guarda un cursor para continuar el escaneo en ejecuciones posteriores. Reintenta tareas de borrado, recupera reservas vencidas y elimina temporales de más de 24 horas. Revisa archivos definitivos generados por el sistema de más de **48 horas** y encola únicamente los que no tienen referencias actuales. Se comprueban las referencias otra vez al borrar. No se recorren enlaces simbólicos ni se aceptan claves fuera de los prefijos propios.

La subida, confirmación y eliminación inmediata de imágenes funciona en cada operación normal. No existe una transacción distribuida entre MySQL y R2: si se cierra el navegador sin completar el descarte o falla el almacenamiento, los pendientes quedan registrados hasta que un Administrador ejecute la limpieza. No hay un programador automático. El vencimiento de 24 horas invalida los tokens, pero no ejecuta por sí solo el borrado físico. Si `hayMasArchivos` es verdadero, pueden realizarse nuevas llamadas para continuar el escaneo.

Como protección adicional opcional en R2, puede configurarse una regla de ciclo de vida de **2 días exclusivamente para `tmp/bicicletas/`**. No aplicar esa regla a `productos/`, donde quedan los archivos confirmados. [Ciclos de vida de R2](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

## Verificación

```powershell
npm.cmd run typecheck
```

Pruebas manuales sugeridas en un entorno de prueba:

- Guardar una foto nueva y comprobar que queda asociada por su URL definitiva.
- Quitar una foto y comprobar que el archivo deja de estar disponible cuando no tiene otras referencias.
- Cancelar después de una subida temporal y comprobar su descarte.
- Simular un fallo del almacenamiento y comprobar que el guardado informa el error o registra la limpieza pendiente, según el paso que falló.
- Ejecutar la limpieza con sesión de Administrador y comprobar que conserva archivos compartidos. Una sesión sin ese rol debe recibir 403 y una petición sin sesión debe recibir 401.
- Comprobar que una orden cerrada no permite editar la bicicleta ni confirmar nuevas fotos.
