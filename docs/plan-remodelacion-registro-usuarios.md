# Plan de implementación: remodelación del registro de usuarios

## 1. Contexto

Actualmente, la aplicación permite que una persona cree una cuenta desde la
pantalla pública de inicio de sesión mediante `POST /api/auth/register`. La
remodelación busca que la creación de cuentas deje de ser pública y pase a ser
una operación exclusiva del rol **Administrador**.

La funcionalidad se dividirá en dos fases:

1. **Fase 1 — Registro directo por un administrador:** alcance aprobado para
   implementación.
2. **Fase 2 — Invitación por correo:** pendiente de decisiones funcionales y,
   por lo tanto, fuera del alcance de la primera implementación.

Este plan respeta la restricción de **no modificar el modelo de datos**. No se
agregarán tablas, columnas, relaciones, enums ni migraciones de Prisma.

## 2. Objetivos

- Eliminar el autorregistro público de usuarios.
- Permitir que solamente un administrador autenticado cree usuarios.
- Permitir la creación directa desde la sección de usuarios.
- Validar los datos y el rol exclusivamente en el backend.
- Registrar la creación en la tabla de auditoría existente.
- Mantener fuera de la Fase 1 cualquier implementación parcial de invitaciones.

## 3. Fuera de alcance general

- Cambios en `prisma/schema.prisma` o nuevas migraciones.
- Creación de roles o permisos nuevos.
- Administración personalizada de permisos por usuario.
- Eliminación física de usuarios.
- Implementación de la invitación por correo durante la Fase 1.
- Obligación técnica de cambiar la contraseña en el primer acceso, porque el
  modelo actual no posee un indicador para representar esa condición.

## 4. Situación técnica actual

- `POST /api/auth/register` permite crear usuarios sin autenticación.
- El endpoint público acepta actualmente `idRol` y `estado` desde el cliente.
- `GET /api/users` ya está protegido mediante `users:read`.
- Existe el permiso `users:create`, asignado al rol Administrador en el seed.
- La sección `/usuarios` lista usuarios y permite administrar sus roles, pero
  todavía no contiene un formulario de creación.
- `Usuario.contrasenaHash` es obligatorio.
- Las operaciones pueden registrarse utilizando el modelo `Auditoria` actual.
- El proyecto ya cuenta con bcrypt, Zod, NextAuth y Prisma.

## 5. Decisiones adoptadas para la Fase 1

- El administrador completará todos los datos obligatorios del nuevo usuario.
- El administrador definirá una contraseña inicial.
- El usuario será creado con estado `ACTIVO`.
- El rol será obligatorio y deberá existir y estar activo.
- No se aceptará el estado del usuario desde el frontend.
- Se permitirá asignar cualquiera de los roles activos existentes, incluido
  Administrador. La operación deberá quedar auditada.
- La contraseña inicial no será enviada por correo ni incluida en respuestas o
  registros. El administrador deberá comunicarla por un medio externo seguro.
- El usuario podrá cambiar posteriormente su contraseña desde su perfil.
- La autorización se comprobará en el servidor; ocultar el botón en la interfaz
  será solamente una medida de experiencia de usuario.

---

# Fase 1 — Registro directo por un administrador

## 6. Alcance funcional

Desde la sección `/usuarios`, un administrador podrá abrir un formulario,
completar los datos de una persona, asignarle un rol y crear inmediatamente una
cuenta activa.

El flujo esperado será:

1. El administrador accede a `/usuarios`.
2. Selecciona **Registrar usuario**.
3. Completa los datos personales, de acceso y el rol.
4. El frontend envía la solicitud autenticada al backend.
5. El backend vuelve a verificar la identidad y privilegios del administrador.
6. El backend valida los datos, crea el usuario y registra la auditoría en una
   transacción.
7. La interfaz informa el resultado y actualiza el listado.

## 7. Contrato propuesto del backend

### 7.1 Endpoint

Agregar `POST /api/users` al archivo que actualmente implementa
`GET /api/users`.

### 7.2 Solicitud

```json
{
  "primerNombre": "Camila",
  "segundoNombre": null,
  "apellidoPaterno": "Soto",
  "apellidoMaterno": "Rojas",
  "rut": "12.345.678-5",
  "correo": "camila.soto@ejemplo.cl",
  "telefono": "+56 9 1234 5678",
  "idRol": 2,
  "contrasena": "contraseña-inicial",
  "confirmacionContrasena": "contraseña-inicial"
}
```

Reglas del contrato:

- `primerNombre`, `apellidoPaterno`, `rut`, `correo`, `idRol`, `contrasena` y
  `confirmacionContrasena` serán obligatorios.
- `segundoNombre`, `apellidoMaterno` y `telefono` serán opcionales.
- No se aceptarán `estado`, `contrasenaHash`, `sessionVersion`, tokens ni fechas.
- La contraseña solo se utilizará durante la solicitud y nunca será devuelta.

### 7.3 Respuesta exitosa

Código HTTP `201 Created`:

```json
{
  "data": {
    "idUsuario": 15,
    "primerNombre": "Camila",
    "segundoNombre": null,
    "apellidoPaterno": "Soto",
    "apellidoMaterno": "Rojas",
    "rut": "12.345.678-5",
    "correoElectronico": "camila.soto@ejemplo.cl",
    "telefono": "+56 9 1234 5678",
    "estado": "ACTIVO",
    "fechaCreacion": "2026-10-30T12:00:00.000Z",
    "ultimoAcceso": null,
    "rol": {
      "idRol": 2,
      "nombre": "Vendedor",
      "descripcion": "Acceso a ventas en mostrador y clientes"
    }
  }
}
```

### 7.4 Respuestas de error

Las respuestas deberán usar JSON consistente con `code`, `message` y, cuando
corresponda, `fields`.

| HTTP  | Código                     | Caso                                                  |
| ----- | -------------------------- | ----------------------------------------------------- |
| `400` | `DATOS_INVALIDOS`          | Cuerpo JSON inválido o campos mal formados            |
| `400` | `CONTRASENAS_NO_COINCIDEN` | Confirmación diferente de la contraseña               |
| `401` | `NO_AUTORIZADO`            | No existe una sesión válida                           |
| `403` | `SOLO_ADMINISTRADOR`       | La sesión no pertenece actualmente a un administrador |
| `404` | `ROL_NO_ENCONTRADO`        | El rol solicitado no existe                           |
| `409` | `ROL_INACTIVO`             | El rol existe, pero no puede asignarse                |
| `409` | `RUT_EN_USO`               | Ya existe una cuenta con el RUT normalizado           |
| `409` | `CORREO_EN_USO`            | Ya existe una cuenta con el correo normalizado        |
| `500` | `ERROR_INTERNO`            | Error inesperado sin detalles sensibles               |

## 8. Autorización

La protección del endpoint deberá realizarse antes de procesar los datos:

1. Exigir una sesión válida.
2. Exigir el permiso `users:create`.
3. Consultar el usuario actor en la base de datos y confirmar que continúa
   `ACTIVO` y que su rol actual es `Administrador`.

La tercera comprobación evita depender exclusivamente del rol y permisos
guardados en el JWT, que pueden quedar desactualizados hasta que termine la
sesión.

Se recomienda encapsular estas reglas en un helper reutilizable, por ejemplo
`requireAdministrator`, para utilizarlo posteriormente en el envío y reenvío de
invitaciones.

## 9. Validación y normalización

Crear un esquema Zod dedicado al registro administrativo.

Validaciones mínimas:

- Eliminar espacios laterales en todos los textos.
- Convertir el correo a minúsculas.
- Validar el formato y longitud del correo.
- Normalizar el RUT al formato utilizado por `Usuario`.
- Validar la estructura y normalizar el RUT mediante el helper compartido por
  clientes y proveedores. No se calculará el dígito verificador para conservar
  el comportamiento uniforme del proyecto.
- Respetar las longitudes máximas definidas por Prisma.
- Validar el formato y longitud del teléfono cuando se proporcione.
- Exigir contraseña de al menos 8 caracteres y rechazar caracteres de control,
  manteniendo inicialmente la política existente.
- Exigir que contraseña y confirmación coincidan.
- Exigir un `idRol` entero positivo.
- Consultar el rol y comprobar `estado = ACTIVO`.

La política de contraseñas deberá centralizarse para que registro directo,
cambio de contraseña, recuperación e invitaciones no apliquen reglas distintas.

## 10. Persistencia y concurrencia

La creación se realizará mediante una transacción Prisma:

1. Generar `contrasenaHash` con el helper bcrypt existente.
2. Crear `Usuario` con estado `ACTIVO`.
3. Crear la entrada de `Auditoria` usando como actor al administrador.
4. Confirmar la transacción.

Auditoría propuesta:

- `idUsuario`: administrador que ejecutó la operación.
- `tipoOperacion`: `CREAR_USUARIO_DIRECTO`.
- `nombreTablaAfectada`: `usuarios`.
- `registroAfectado`: identificador del usuario creado.
- `valorAnterior`: `null`.
- `valorNuevo`: datos no sensibles del usuario y rol asignado.
- `detalleCambio`: descripción breve de la creación administrativa.

Nunca se incluirán la contraseña, su hash, tokens o secretos en la auditoría.

Aunque se consulten previamente RUT y correo para entregar mensajes específicos,
también se deberán capturar las restricciones únicas de Prisma (`P2002`). Esto
protege frente a solicitudes concurrentes que intenten crear la misma cuenta.

## 11. Retiro del autorregistro público

La Fase 1 no estará terminada mientras siga existiendo una vía pública de
creación de cuentas.

Tareas:

- Eliminar el modo `register` de la pantalla `/sign-in`.
- Mantener únicamente inicio de sesión y recuperación de contraseña.
- Retirar `POST /api/auth/register` o reemplazarlo temporalmente por una
  respuesta `410 Gone` que no cree usuarios.
- Buscar y eliminar consumidores restantes del endpoint público.
- Verificar que una solicitud anónima no pueda crear una cuenta por ninguna
  ruta alternativa.

## 12. Integración en la sección de usuarios

Una vez estabilizado el backend:

- Agregar el botón **Registrar usuario** en el encabezado de `/usuarios`.
- Mostrarlo solamente cuando la sesión tenga el permiso `users:create` y el rol
  Administrador.
- Implementar un diálogo o formulario con los campos del contrato.
- Obtener los roles desde el endpoint existente, filtrando en el backend solo
  roles activos y asignables.
- No ofrecer `Sin Rol` como opción para un registro directo.
- Mostrar errores por campo utilizando los códigos de la API.
- Deshabilitar el envío mientras la solicitud esté en curso.
- Evitar envíos dobles accidentales.
- Al crear correctamente, cerrar el formulario, mostrar confirmación y agregar
  o recargar el usuario en el listado.
- Limpiar inmediatamente la contraseña del estado del componente después de
  completar o cancelar la operación.

## 13. Ajustes relacionados

Durante la implementación deberán revisarse estas inconsistencias existentes:

- El código de registro y revocación espera un rol `Sin Rol`, pero el seed actual
  no lo crea. El registro directo no dependerá de ese rol.
- `GET /api/roles` debe filtrar roles inactivos para la asignación.
- Los cambios de rol o estado deberían incrementar `sessionVersion` para cerrar
  sesiones con privilegios anteriores. Si este endurecimiento se separa en otra
  tarea, deberá quedar registrado como deuda de seguridad prioritaria.

## 14. Orden de implementación de la Fase 1

### 14.1 Backend

- [ ] Centralizar validación y normalización de usuario, RUT y contraseña.
- [ ] Crear el helper de autorización administrativa.
- [ ] Implementar `POST /api/users`.
- [ ] Crear usuario y auditoría en una transacción.
- [ ] Manejar conflictos únicos y errores con respuestas JSON consistentes.
- [ ] Filtrar roles activos y asignables.
- [ ] Deshabilitar o retirar `POST /api/auth/register`.

### 14.2 Frontend

- [ ] Retirar la pestaña pública de registro.
- [ ] Agregar la acción **Registrar usuario** en `/usuarios`.
- [ ] Implementar el formulario de creación directa.
- [ ] Integrar errores por campo y estados de carga.
- [ ] Actualizar el listado después de una creación exitosa.

### 14.3 Verificación

- [ ] Ejecutar `npm run typecheck`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Probar manualmente los escenarios de aceptación y rechazo.
- [ ] Confirmar que no se registran contraseñas o hashes en logs o auditoría.

## 15. Casos de prueba de la Fase 1

### 15.1 Casos exitosos

- Administrador crea un usuario con todos los datos obligatorios.
- Administrador crea un usuario con campos opcionales vacíos.
- Correo con mayúsculas y espacios queda normalizado.
- RUT válido queda almacenado en el formato canónico.
- Usuario creado puede iniciar sesión con la contraseña inicial.
- Usuario creado puede cambiar su contraseña desde el perfil.
- La creación aparece en auditoría con el administrador correcto.

### 15.2 Casos rechazados

- Solicitud sin sesión.
- Solicitud realizada por un usuario no administrador.
- JWT que indica Administrador, pero cuyo usuario o rol actual ya no lo permite.
- RUT inválido.
- Correo inválido.
- RUT duplicado.
- Correo duplicado con diferencias de mayúsculas.
- Rol inexistente o inactivo.
- Contraseña demasiado corta.
- Confirmación de contraseña diferente.
- Intento de enviar `estado`, `contrasenaHash` u otros campos internos.
- Dos solicitudes concurrentes con el mismo correo o RUT.
- Solicitud anónima contra el antiguo endpoint de registro.

## 16. Criterios de aceptación de la Fase 1

- [ ] No existe autorregistro desde `/sign-in`.
- [ ] El antiguo endpoint público no crea usuarios.
- [ ] Solo un administrador activo puede ejecutar el registro directo.
- [ ] El backend no confía en el estado ni en campos internos enviados por el
      cliente.
- [ ] RUT, correo, rol y contraseña son validados en el servidor.
- [ ] La cuenta se crea activa con un rol válido.
- [ ] La contraseña se almacena únicamente como hash bcrypt.
- [ ] La respuesta no contiene datos sensibles.
- [ ] La creación queda auditada.
- [ ] Los conflictos de RUT y correo tienen respuestas controladas.
- [ ] La nueva cuenta puede iniciar sesión.
- [ ] Typecheck, lint y build finalizan correctamente.

---

# Fase 2 — Invitación por correo

## 17. Estado de la fase

**Pendiente de decisiones funcionales. No debe implementarse como parte de la
Fase 1.**

No se crearán todavía endpoints, formularios, plantillas de correo ni lógica de
tokens para invitaciones. Se evita así construir un flujo provisional que luego
deba cambiar según quién complete los datos y cómo se represente su estado.

## 18. Decisiones pendientes

Antes de iniciar la Fase 2 deben resolverse y documentarse estos puntos:

1. **Datos solicitados al administrador**
   - Opción recomendada: el administrador completa nombre, RUT, correo y rol; el
     invitado solamente define su contraseña.
   - Alternativa: el administrador proporciona solo el correo y el invitado
     completa su identidad. Sin modificar el modelo, esta alternativa obliga a
     usar una invitación sin persistencia o datos temporales no deseables.

2. **Representación de una invitación pendiente**
   - Determinar si se reutilizarán `tokenRecuperacion`,
     `tokenRecuperacionExpira` y `estado = INACTIVO`.
   - Confirmar los estados derivados que verá la interfaz: pendiente, expirada,
     aceptada, cancelada o error de entrega.

3. **Duración del enlace**
   - Definir si la invitación vence en 24, 48 o 72 horas.

4. **Reenvío y cancelación**
   - Definir quién puede reenviar o cancelar.
   - Definir si reenviar invalida inmediatamente el enlace anterior.
   - Definir qué ocurre con el RUT y correo reservados al cancelar.

5. **Rol y activación**
   - Confirmar si el rol queda fijado al enviar la invitación.
   - Confirmar si se puede invitar a otro Administrador.
   - Confirmar que la cuenta se activa solamente al establecer la contraseña.

6. **Responsabilidad ante errores de correo**
   - Determinar si la cuenta pendiente permanece creada cuando Resend falla.
   - Definir el estado y mensaje que verá el administrador.

7. **Experiencia del invitado**
   - Definir contenido y marca del correo.
   - Definir pantalla de aceptación, política de contraseña y redirección final.
   - Definir qué información podrá revisar o modificar el invitado.

8. **Seguridad y operación**
   - Definir límites de reenvío.
   - Definir eventos de auditoría.
   - Confirmar URL pública por ambiente y remitente autorizado en Resend.

## 19. Diseño técnico preliminar no aprobado

Si se adopta la opción recomendada —administrador completa la identidad y el
invitado define únicamente su contraseña—, el diseño podría utilizar:

- `POST /api/users/invitations`: crear usuario inactivo y enviar invitación.
- `POST /api/users/{id}/invitation`: rotar token y reenviar.
- `POST /api/users/invitations/accept`: consumir token, establecer contraseña y
  activar al usuario.
- Token aleatorio con prefijo de propósito, por ejemplo `inv_`, almacenado solo
  como hash.
- `tokenRecuperacionExpira` como vencimiento.
- Una contraseña aleatoria no comunicada mientras la cuenta está inactiva.
- Estado de presentación derivado a partir de `estado`, token y vencimiento.

Este diseño es solamente una referencia para la conversación y no autoriza su
implementación.

## 20. Criterios de entrada para la Fase 2

La Fase 2 podrá planificarse para desarrollo cuando:

- [ ] Se haya cerrado la Fase 1 y validado en el ambiente correspondiente.
- [ ] Se haya decidido quién completa cada dato del usuario.
- [ ] Se haya aprobado la reutilización de los campos de recuperación.
- [ ] Se hayan definido expiración, reenvío y cancelación.
- [ ] Se haya definido el comportamiento ante fallos de correo.
- [ ] Se haya aprobado la experiencia y contenido del correo.
- [ ] Se hayan establecido sus criterios de aceptación definitivos.

## 21. Entregables esperados

### Fase 1

- Endpoint administrativo de registro directo.
- Autorregistro público eliminado.
- Formulario de creación en `/usuarios`.
- Validación, autorización y auditoría.
- Evidencia de pruebas y validaciones técnicas.

### Fase 2

- Por ahora, únicamente el registro de decisiones pendientes contenido en este
  documento.
- La implementación se diseñará en detalle después de cerrar dichas decisiones.
