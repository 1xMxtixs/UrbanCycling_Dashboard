import { db } from "../lib/db";

async function main() {
  console.log("🌱 Iniciando seed de datos...\n");

  // ──────────────────────────────────────────────
  // Limpieza en orden (FKs)
  // ──────────────────────────────────────────────
  console.log("🧹 Limpiando datos existentes...");
  await db.referenciaDte.deleteMany();
  await db.origenDocumentoTributario.deleteMany();
  await db.documentoTributario.deleteMany();
  await db.asignacionPago.deleteMany();
  await db.pago.deleteMany();
  await db.movimientoInventario.deleteMany();
  await db.lineaDeAjuste.deleteMany();
  await db.ajusteInventario.deleteMany();
  await db.lineaDeOrdenDeCompra.deleteMany();
  await db.ordenDeCompra.deleteMany();
  await db.imagenBicicleta.deleteMany();
  await db.bicicleta.deleteMany();
  await db.lineaDeOrdenDeTrabajo.deleteMany();
  await db.ordenDeTrabajo.deleteMany();
  await db.lineaDeVenta.deleteMany();
  await db.ventaEnMostrador.deleteMany();
  await db.venta.deleteMany();
  await db.reclamoGarantia.deleteMany();
  await db.productoServicio.deleteMany();
  await db.servicio.deleteMany();
  await db.categoriaProducto.deleteMany();
  await db.categoria.deleteMany();
  await db.producto.deleteMany();
  await db.direccionCliente.deleteMany();
  await db.telefonoCliente.deleteMany();
  await db.cliente.deleteMany();
  await db.direccionProveedor.deleteMany();
  await db.correoProveedor.deleteMany();
  await db.telefonoProveedor.deleteMany();
  await db.proveedor.deleteMany();
  await db.auditoria.deleteMany();
  await db.usuario.deleteMany();
  await db.rolPermiso.deleteMany();
  await db.rol.deleteMany();
  await db.permiso.deleteMany();

  // ──────────────────────────────────────────────
  // 1. PERMISOS
  // ──────────────────────────────────────────────
  console.log("📋 Creando permisos...");
  const permisosData = [
    { nombre: "Ver inventario", modulo: "inventario", recurso: "inventario", accion: "read", codigo: "inventory:read", descripcion: "Permite ver el listado de productos" },
    { nombre: "Crear inventario", modulo: "inventario", recurso: "inventario", accion: "create", codigo: "inventory:create", descripcion: "Permite crear nuevos productos" },
    { nombre: "Actualizar inventario", modulo: "inventario", recurso: "inventario", accion: "update", codigo: "inventory:update", descripcion: "Permite modificar productos" },
    { nombre: "Eliminar inventario", modulo: "inventario", recurso: "inventario", accion: "delete", codigo: "inventory:delete", descripcion: "Permite eliminar productos" },
    { nombre: "Ver bicicletas", modulo: "bicicletas", recurso: "bicicletas", accion: "read", codigo: "bicycles:read", descripcion: "Permite ver el listado de bicicletas" },
    { nombre: "Crear bicicletas", modulo: "bicicletas", recurso: "bicicletas", accion: "create", codigo: "bicycles:create", descripcion: "Permite registrar bicicletas" },
    { nombre: "Actualizar bicicletas", modulo: "bicicletas", recurso: "bicicletas", accion: "update", codigo: "bicycles:update", descripcion: "Permite modificar bicicletas" },
    { nombre: "Eliminar bicicletas", modulo: "bicicletas", recurso: "bicicletas", accion: "delete", codigo: "bicycles:delete", descripcion: "Permite eliminar bicicletas" },
    { nombre: "Ver clientes", modulo: "clientes", recurso: "clientes", accion: "read", codigo: "clients:read", descripcion: "Permite ver el listado de clientes" },
    { nombre: "Crear clientes", modulo: "clientes", recurso: "clientes", accion: "create", codigo: "clients:create", descripcion: "Permite crear nuevos clientes" },
    { nombre: "Actualizar clientes", modulo: "clientes", recurso: "clientes", accion: "update", codigo: "clients:update", descripcion: "Permite modificar clientes" },
    { nombre: "Eliminar clientes", modulo: "clientes", recurso: "clientes", accion: "delete", codigo: "clients:delete", descripcion: "Permite eliminar clientes" },
    { nombre: "Ver ordenes trabajo", modulo: "ordenes_trabajo", recurso: "ordenes_trabajo", accion: "read", codigo: "work-orders:read", descripcion: "Permite ver ordenes de trabajo" },
    { nombre: "Crear ordenes trabajo", modulo: "ordenes_trabajo", recurso: "ordenes_trabajo", accion: "create", codigo: "work-orders:create", descripcion: "Permite crear ordenes de trabajo" },
    { nombre: "Actualizar ordenes trabajo", modulo: "ordenes_trabajo", recurso: "ordenes_trabajo", accion: "update", codigo: "work-orders:update", descripcion: "Permite modificar ordenes de trabajo" },
    { nombre: "Actualizar estado OT", modulo: "ordenes_trabajo", recurso: "ordenes_trabajo", accion: "update-status", codigo: "work-orders:update-status", descripcion: "Permite cambiar el estado de una OT" },
    { nombre: "Ver ventas", modulo: "ventas", recurso: "ventas", accion: "read", codigo: "sales:read", descripcion: "Permite ver ventas" },
    { nombre: "Crear ventas", modulo: "ventas", recurso: "ventas", accion: "create", codigo: "sales:create", descripcion: "Permite crear ventas" },
    { nombre: "Crear pagos", modulo: "pagos", recurso: "pagos", accion: "create", codigo: "payments:create", descripcion: "Permite registrar pagos" },
    { nombre: "Crear DTE", modulo: "dte", recurso: "dte", accion: "create", codigo: "receipts:create", descripcion: "Permite emitir documentos tributarios" },
    { nombre: "Ver usuarios", modulo: "usuarios", recurso: "usuarios", accion: "read", codigo: "users:read", descripcion: "Permite ver usuarios" },
    { nombre: "Crear usuarios", modulo: "usuarios", recurso: "usuarios", accion: "create", codigo: "users:create", descripcion: "Permite crear usuarios" },
    { nombre: "Actualizar usuarios", modulo: "usuarios", recurso: "usuarios", accion: "update", codigo: "users:update", descripcion: "Permite modificar usuarios" },
    { nombre: "Ver roles", modulo: "roles", recurso: "roles", accion: "read", codigo: "roles:read", descripcion: "Permite ver roles" },
    { nombre: "Asignar roles", modulo: "roles", recurso: "roles", accion: "assign", codigo: "roles:assign", descripcion: "Permite asignar roles" },
    { nombre: "Quitar roles", modulo: "roles", recurso: "roles", accion: "remove", codigo: "roles:remove", descripcion: "Permite quitar roles" },
    { nombre: "Ver reportes", modulo: "reportes", recurso: "reportes", accion: "read", codigo: "reports:read", descripcion: "Permite ver reportes" },
  ];

  const permisos: Awaited<ReturnType<typeof db.permiso.create>>[] = [];
  for (const p of permisosData) {
    permisos.push(await db.permiso.create({ data: p }));
  }
  console.log(`  ${permisos.length} permisos creados.`);

  // ──────────────────────────────────────────────
  // 2. ROLES
  // ──────────────────────────────────────────────
  console.log("👥 Creando roles...");
  const adminPermisos = permisos.map((p) => p.idPermiso);

  const roles = [];
  roles.push(await db.rol.create({
    data: {
      nombre: "Administrador",
      descripcion: "Acceso completo al sistema",
      estado: "activo",
      permisosRol: { create: adminPermisos.map((id) => ({ idPermiso: id })) },
    },
  }));
  roles.push(await db.rol.create({
    data: {
      nombre: "Mecánico",
      descripcion: "Acceso a módulos de bicicletas y ordenes de trabajo",
      estado: "activo",
      permisosRol: {
        create: permisos
          .filter((p) =>
            [
              "bicycles:read", "bicycles:create", "bicycles:update",
              "work-orders:read", "work-orders:create", "work-orders:update",
              "work-orders:update-status",
              "inventory:read",
              "clients:read",
            ].includes(p.codigo)
          )
          .map((p) => ({ idPermiso: p.idPermiso })),
      },
    },
  }));
  roles.push(await db.rol.create({
    data: {
      nombre: "Vendedor",
      descripcion: "Acceso a ventas en mostrador y clientes",
      estado: "activo",
      permisosRol: {
        create: permisos
          .filter((p) =>
            [
              "sales:read", "sales:create",
              "clients:read", "clients:create", "clients:update",
              "inventory:read",
              "payments:create",
              "receipts:create",
              "bicycles:read", "bicycles:create",
            ].includes(p.codigo)
          )
          .map((p) => ({ idPermiso: p.idPermiso })),
      },
    },
  }));
  roles.push(await db.rol.create({
    data: {
      nombre: "Bodeguero",
      descripcion: "Acceso a inventario y compras",
      estado: "activo",
      permisosRol: {
        create: permisos
          .filter((p) =>
            [
              "inventory:read", "inventory:create", "inventory:update",
              "inventory:delete",
            ].includes(p.codigo)
          )
          .map((p) => ({ idPermiso: p.idPermiso })),
      },
    },
  }));
  console.log(`  ${roles.length} roles creados.`);

  // ──────────────────────────────────────────────
  // 3. USUARIOS
  // ──────────────────────────────────────────────
  console.log("🧑‍💼 Creando usuarios...");
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("admin123", 12);

  const usuarios = await Promise.all([
    db.usuario.create({
      data: {
        idRol: roles[0].idRol,
        primerNombre: "Admin",
        apellidoPaterno: "Sistema",
        rut: "11111111-1",
        correo: "admin@urbancycling.cl",
        contrasenaHash: hash,
        estado: "activo",
        telefono: "+56 9 1111 1111",
      },
    }),
    db.usuario.create({
      data: {
        idRol: roles[1].idRol,
        primerNombre: "Carlos",
        apellidoPaterno: "Muñoz",
        apellidoMaterno: "López",
        rut: "22222222-2",
        correo: "carlos.munoz@urbancycling.cl",
        contrasenaHash: hash,
        estado: "activo",
        telefono: "+56 9 2222 2222",
      },
    }),
    db.usuario.create({
      data: {
        idRol: roles[1].idRol,
        primerNombre: "Pedro",
        apellidoPaterno: "Ramírez",
        apellidoMaterno: "Soto",
        rut: "33333333-3",
        correo: "pedro.ramirez@urbancycling.cl",
        contrasenaHash: hash,
        estado: "activo",
        telefono: "+56 9 3333 3333",
      },
    }),
    db.usuario.create({
      data: {
        idRol: roles[2].idRol,
        primerNombre: "María",
        segundoNombre: "José",
        apellidoPaterno: "González",
        apellidoMaterno: "Martínez",
        rut: "44444444-4",
        correo: "maria.gonzalez@urbancycling.cl",
        contrasenaHash: hash,
        estado: "activo",
        telefono: "+56 9 4444 4444",
      },
    }),
    db.usuario.create({
      data: {
        idRol: roles[2].idRol,
        primerNombre: "Ana",
        apellidoPaterno: "Torres",
        apellidoMaterno: "Vega",
        rut: "55555555-5",
        correo: "ana.torres@urbancycling.cl",
        contrasenaHash: hash,
        estado: "activo",
        telefono: "+56 9 5555 5555",
      },
    }),
    db.usuario.create({
      data: {
        idRol: roles[3].idRol,
        primerNombre: "Luis",
        apellidoPaterno: "Fernández",
        apellidoMaterno: "Rivas",
        rut: "66666666-6",
        correo: "luis.fernandez@urbancycling.cl",
        contrasenaHash: hash,
        estado: "activo",
        telefono: "+56 9 6666 6666",
      },
    }),
  ]);
  console.log(`  ${usuarios.length} usuarios creados.`);

  // ──────────────────────────────────────────────
  // 4. CATEGORIAS
  // ──────────────────────────────────────────────
  console.log("📂 Creando categorías...");
  const categorias = await Promise.all([
    db.categoria.create({ data: { nombre: "Cuadros", descripcion: "Cuadros de bicicletas", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Ruedas", descripcion: "Ruedas y neumáticos", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Frenos", descripcion: "Sistemas de frenado", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Transmisión", descripcion: "Cadenas, platos y piñones", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Suspensión", descripcion: "Horquillas y amortiguadores", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Rodamiento", descripcion: "Rodamientos y juegos de dirección", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Accesorios", descripcion: "Luces, campanas, portaequipajes", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Indumentaria", descripcion: "Ropa y calzado ciclista", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Lubricantes", descripcion: "Aceites y grasas", estado: "activo" } }),
    db.categoria.create({ data: { nombre: "Herramientas", descripcion: "Herramientas de taller", estado: "activo" } }),
  ]);
  console.log(`  ${categorias.length} categorías creadas.`);

  // ──────────────────────────────────────────────
  // 5. PRODUCTOS
  // ──────────────────────────────────────────────
  console.log("🔧 Creando productos...");
  const productosData = [
    { nombre: "Cuadro Aluminio MTB 29", descripcion: "Cuadro de aluminio 29 pulgadas", precioVenta: 250000, costoPromedio: 150000, stockMinimo: 2, stockActual: 10, tipoProducto: "repuesto", catIds: [categorias[0].idCategoria] },
    { nombre: "Cuadro Carbono Ruta", descripcion: "Cuadro de carbono para bicicleta de ruta", precioVenta: 650000, costoPromedio: 400000, stockMinimo: 1, stockActual: 5, tipoProducto: "repuesto", catIds: [categorias[0].idCategoria] },
    { nombre: "Rueda Trasera MTB 29", descripcion: "Rueda trasera 29 con buje sellado", precioVenta: 120000, costoPromedio: 75000, stockMinimo: 3, stockActual: 8, tipoProducto: "repuesto", catIds: [categorias[1].idCategoria] },
    { nombre: "Rueda Delantera Ruta 700c", descripcion: "Rueda delantera 700c aluminio", precioVenta: 110000, costoPromedio: 70000, stockMinimo: 3, stockActual: 6, tipoProducto: "repuesto", catIds: [categorias[1].idCategoria] },
    { nombre: "Cubierta MTB 29x2.2", descripcion: "Cubierta todoterreno 29 pulgadas", precioVenta: 35000, costoPromedio: 20000, stockMinimo: 5, stockActual: 20, tipoProducto: "repuesto", catIds: [categorias[1].idCategoria] },
    { nombre: "Cubierta Ruta 700x25c", descripcion: "Cubierta lisa para ruta 700c", precioVenta: 30000, costoPromedio: 18000, stockMinimo: 5, stockActual: 15, tipoProducto: "repuesto", catIds: [categorias[1].idCategoria] },
    { nombre: "Freno Disco Hidráulico", descripcion: "Freno de disco hidráulico completo", precioVenta: 85000, costoPromedio: 50000, stockMinimo: 3, stockActual: 12, tipoProducto: "repuesto", catIds: [categorias[2].idCategoria] },
    { nombre: "Pastillas de Freno Resina", descripcion: "Pastillas de freno orgánicas", precioVenta: 12000, costoPromedio: 6000, stockMinimo: 10, stockActual: 40, tipoProducto: "repuesto", catIds: [categorias[2].idCategoria] },
    { nombre: "Cadena 11 Velocidades", descripcion: "Cadena HG 11 velocidades", precioVenta: 25000, costoPromedio: 15000, stockMinimo: 5, stockActual: 25, tipoProducto: "repuesto", catIds: [categorias[3].idCategoria] },
    { nombre: "Plato 34 Dientes", descripcion: "Plato aleación 34 dientes 4 brazos", precioVenta: 35000, costoPromedio: 20000, stockMinimo: 3, stockActual: 10, tipoProducto: "repuesto", catIds: [categorias[3].idCategoria] },
    { nombre: "Piñon 11-46T 11 Vel", descripcion: "Casette 11-46 dientes 11 velocidades", precioVenta: 55000, costoPromedio: 32000, stockMinimo: 3, stockActual: 7, tipoProducto: "repuesto", catIds: [categorias[3].idCategoria] },
    { nombre: "Horquilla MTB Aire 120mm", descripcion: "Horquilla de aire 120mm recorrido", precioVenta: 180000, costoPromedio: 110000, stockMinimo: 1, stockActual: 4, tipoProducto: "repuesto", catIds: [categorias[4].idCategoria] },
    { nombre: "Amortiguador Trasero", descripcion: "Amortiguador trasero 200x57mm", precioVenta: 150000, costoPromedio: 90000, stockMinimo: 1, stockActual: 3, tipoProducto: "repuesto", catIds: [categorias[4].idCategoria] },
    { nombre: "Juego Dirección Integrado", descripcion: "Juego de dirección 1-1/8 integrado", precioVenta: 25000, costoPromedio: 14000, stockMinimo: 3, stockActual: 15, tipoProducto: "repuesto", catIds: [categorias[5].idCategoria] },
    { nombre: "Rodamiento Pedalier BSA", descripcion: "Pedalier BSA 68/73mm", precioVenta: 20000, costoPromedio: 11000, stockMinimo: 3, stockActual: 12, tipoProducto: "repuesto", catIds: [categorias[5].idCategoria] },
    { nombre: "Casco Urbano M/L", descripcion: "Casco urbano ajustable talla M/L", precioVenta: 45000, costoPromedio: 25000, stockMinimo: 5, stockActual: 14, tipoProducto: "accesorio", catIds: [categorias[6].idCategoria] },
    { nombre: "Luz Delantera LED 800lm", descripcion: "Faro LED recargable 800 lúmenes", precioVenta: 28000, costoPromedio: 16000, stockMinimo: 5, stockActual: 20, tipoProducto: "accesorio", catIds: [categorias[6].idCategoria] },
    { nombre: "Luz Trasera LED", descripcion: "Luz trasera LED recargable", precioVenta: 15000, costoPromedio: 8000, stockMinimo: 5, stockActual: 25, tipoProducto: "accesorio", catIds: [categorias[6].idCategoria] },
    { nombre: "Portaequipajes Trasero", descripcion: "Portaequipajes aluminio universal", precioVenta: 22000, costoPromedio: 12000, stockMinimo: 3, stockActual: 10, tipoProducto: "accesorio", catIds: [categorias[6].idCategoria] },
    { nombre: "Camiseta Ciclismo M/C", descripcion: "Camiseta manga corta transpirable", precioVenta: 25000, costoPromedio: 14000, stockMinimo: 5, stockActual: 18, tipoProducto: "accesorio", catIds: [categorias[7].idCategoria] },
    { nombre: "Guantes Ciclismo T/M", descripcion: "Guantes dedos cortos con gel", precioVenta: 18000, costoPromedio: 10000, stockMinimo: 5, stockActual: 22, tipoProducto: "accesorio", catIds: [categorias[7].idCategoria] },
    { nombre: "Aceite Lubricante 100ml", descripcion: "Aceite lubricante para cadena 100ml", precioVenta: 8000, costoPromedio: 4000, stockMinimo: 10, stockActual: 30, tipoProducto: "insumo", catIds: [categorias[8].idCategoria] },
    { nombre: "Grasa para Rodamientos", descripcion: "Grasa consistente para rodamientos 200g", precioVenta: 6000, costoPromedio: 3000, stockMinimo: 10, stockActual: 20, tipoProducto: "insumo", catIds: [categorias[8].idCategoria] },
    { nombre: "Kit Multiherramienta 16en1", descripcion: "Herramienta multipropósito 16 funciones", precioVenta: 20000, costoPromedio: 11000, stockMinimo: 3, stockActual: 12, tipoProducto: "herramienta", catIds: [categorias[9].idCategoria] },
    { nombre: "Desmontable Neumáticos", descripcion: "Juego de desmontables de neumáticos", precioVenta: 5000, costoPromedio: 2500, stockMinimo: 10, stockActual: 35, tipoProducto: "herramienta", catIds: [categorias[9].idCategoria] },
    { nombre: "Bomba de Pie", descripcion: "Bomba de pie con manómetro", precioVenta: 30000, costoPromedio: 18000, stockMinimo: 3, stockActual: 8, tipoProducto: "herramienta", catIds: [categorias[9].idCategoria] },
  ];

  const productos = await Promise.all(
    productosData.map((p) =>
      db.producto.create({
        data: {
          tipoProducto: p.tipoProducto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          estado: "activo",
          precioVenta: p.precioVenta,
          costoPromedio: p.costoPromedio,
          stockMinimo: p.stockMinimo,
          stockActual: p.stockActual,
          urlImagen: "",
          categoriasProducto: {
            create: p.catIds.map((idCategoria) => ({ idCategoria })),
          },
        },
      })
    )
  );
  console.log(`  ${productos.length} productos creados.`);

  // ──────────────────────────────────────────────
  // 6. SERVICIOS
  // ──────────────────────────────────────────────
  console.log("🔧 Creando servicios...");
  const servicios = await Promise.all([
    db.servicio.create({ data: { nombre: "Ajuste de Cambios", descripcion: "Regulación de cambios delantero y trasero", precioVenta: 15000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Ajuste de Frenos", descripcion: "Regulación de frenos (v-brake o disco)", precioVenta: 12000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Cambio de Cadena", descripcion: "Reemplazo de cadena + ajuste", precioVenta: 10000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Centrado de Rueda", descripcion: "Centrado y tensado de rayos", precioVenta: 18000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Cambio de Cubierta", descripcion: "Reemplazo de cubierta y cámara", precioVenta: 8000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Service Completo MTB", descripcion: "Revisión general + limpieza + ajustes", precioVenta: 45000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Service Completo Ruta", descripcion: "Revisión general + limpieza + ajustes ruta", precioVenta: 50000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Sangrado Frenos Hidráulicos", descripcion: "Purgado y relleno de líquido frenos", precioVenta: 25000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Montaje de Bicicleta Nueva", descripcion: "Ensamblaje y puesta a punto de bicicleta nueva", precioVenta: 35000, estado: "activo" } }),
    db.servicio.create({ data: { nombre: "Diagnóstico Mecánico", descripcion: "Revisión técnica completa con informe", precioVenta: 15000, estado: "activo" } }),
  ]);
  console.log(`  ${servicios.length} servicios creados.`);

  // ──────────────────────────────────────────────
  // 7. ASOCIACION PRODUCTO-SERVICIO
  // ──────────────────────────────────────────────
  console.log("🔗 Asociando productos a servicios...");
  await db.productoServicio.createMany({
    data: [
      { idProducto: productos[8].idProducto, idServicio: servicios[2].idServicio, cantidad: 1 },
      { idProducto: productos[4].idProducto, idServicio: servicios[4].idServicio, cantidad: 1 },
      { idProducto: productos[5].idProducto, idServicio: servicios[4].idServicio, cantidad: 1 },
      { idProducto: productos[7].idProducto, idServicio: servicios[7].idServicio, cantidad: 2 },
      { idProducto: productos[22].idProducto, idServicio: servicios[5].idServicio, cantidad: 1 },
    ],
  });

  // ──────────────────────────────────────────────
  // 8. CLIENTES
  // ──────────────────────────────────────────────
  console.log("👤 Creando clientes...");
  const clientesData = [
    { tipoCliente: "natural", rut: "12345678-9", primerNombre: "Juan", apellidoPaterno: "Perez", apellidoMaterno: "Gonzalez", correo: "juan.perez@email.com", estado: "activo", telefono: "+56 9 1234 5678", region: "Metropolitana", ciudad: "Santiago", comuna: "Providencia", calle: "Av. Providencia", numero: "1234" },
    { tipoCliente: "natural", rut: "23456789-0", primerNombre: "María", apellidoPaterno: "López", apellidoMaterno: "Rojas", correo: "maria.lopez@email.com", estado: "activo", telefono: "+56 9 2345 6789", region: "Metropolitana", ciudad: "Santiago", comuna: "Las Condes", calle: "Av. Las Condes", numero: "567" },
    { tipoCliente: "natural", rut: "34567890-1", primerNombre: "Pedro", apellidoPaterno: "Ramírez", apellidoMaterno: "Soto", correo: "pedro.ramirez@email.com", estado: "activo", telefono: "+56 9 3456 7890", region: "Valparaíso", ciudad: "Viña del Mar", comuna: "Viña del Mar", calle: "Av. San Martín", numero: "890" },
    { tipoCliente: "natural", rut: "45678901-2", primerNombre: "Ana", apellidoPaterno: "Torres", apellidoMaterno: "Vega", correo: "ana.torres@email.com", estado: "activo", telefono: "+56 9 4567 8901", region: "Metropolitana", ciudad: "Santiago", comuna: "Ñuñoa", calle: "Calle Seminario", numero: "345" },
    { tipoCliente: "juridico", rut: "76543210-8", razonSocial: "Ciclismo Total SpA", giro: "Venta de bicicletas y accesorios", nombreContacto: "Roberto Muñoz", correo: "contacto@ciclismototal.cl", estado: "activo", telefono: "+56 2 2123 4567", region: "Metropolitana", ciudad: "Santiago", comuna: "Santiago Centro", calle: "Calle Moneda", numero: "456" },
    { tipoCliente: "natural", rut: "56789012-3", primerNombre: "Luis", apellidoPaterno: "Fernández", apellidoMaterno: "Rivas", correo: "luis.fernandez@email.com", estado: "activo", telefono: "+56 9 5678 9012", region: "Metropolitana", ciudad: "Santiago", comuna: "Estación Central", calle: "Av. Libertador", numero: "2100" },
    { tipoCliente: "natural", rut: "67890123-4", primerNombre: "Carolina", apellidoPaterno: "Martínez", apellidoMaterno: "Díaz", correo: "carolina.martinez@email.com", estado: "activo", telefono: "+56 9 6789 0123", region: "O'Higgins", ciudad: "Rancagua", comuna: "Rancagua", calle: "Calle Estado", numero: "789" },
    { tipoCliente: "juridico", rut: "87654321-9", razonSocial: "Bike Parts Chile Ltda", giro: "Importación y distribución de repuestos", nombreContacto: "Patricio Vera", correo: "ventas@bikeparts.cl", estado: "activo", telefono: "+56 2 2987 6543", region: "Metropolitana", ciudad: "Santiago", comuna: "Maipú", calle: "Av. Los Pajaritos", numero: "1500" },
    { tipoCliente: "natural", rut: "78901234-5", primerNombre: "Francisco", apellidoPaterno: "Aravena", apellidoMaterno: "Mora", correo: "francisco.aravena@email.com", estado: "activo", telefono: "+56 9 7890 1234", region: "Biobío", ciudad: "Concepción", comuna: "Concepción", calle: "Calle Barros Arana", numero: "234" },
    { tipoCliente: "natural", rut: "89012345-6", primerNombre: "Daniela", apellidoPaterno: "Reyes", apellidoMaterno: "Castro", correo: "daniela.reyes@email.com", estado: "activo", telefono: "+56 9 8901 2345", region: "Metropolitana", ciudad: "Santiago", comuna: "La Florida", calle: "Av. Vicuña Mackenna", numero: "4567" },
  ];

  const clientes = await Promise.all(
    clientesData.map((c) =>
      db.cliente.create({
        data: {
          tipoCliente: c.tipoCliente,
          rut: c.rut,
          primerNombre: "tipoCliente" in c && (c as any).tipoCliente === "juridico" ? null : c.primerNombre || null,
          apellidoPaterno: "tipoCliente" in c && (c as any).tipoCliente === "juridico" ? null : c.apellidoPaterno || null,
          apellidoMaterno: c.apellidoMaterno || null,
          razonSocial: (c as any).razonSocial || null,
          giro: (c as any).giro || null,
          nombreContacto: (c as any).nombreContacto || null,
          correo: c.correo,
          estado: c.estado,
          telefonos: c.telefono
            ? { create: [{ telefono: c.telefono, descripcion: "Principal" }] }
            : undefined,
          direcciones: {
            create: [
              {
                region: c.region,
                ciudad: c.ciudad,
                comuna: c.comuna,
                calle: c.calle,
                numero: c.numero,
                descripcion: "Principal",
              },
            ],
          },
        },
      })
    )
  );
  console.log(`  ${clientes.length} clientes creados.`);

  // ──────────────────────────────────────────────
  // 9. PROVEEDORES
  // ──────────────────────────────────────────────
  console.log("🏭 Creando proveedores...");
  await db.proveedor.create({
    data: {
      razonSocial: "Distribuidora de Bicicletas Ltda",
      rut: "98765432-1",
      giro: "Venta al por mayor de bicicletas y repuestos",
      condicionesDePago: "30 días",
      estado: "activo",
      telefonos: { create: [{ telefono: "+56 2 2123 4567", descripcion: "Principal" }] },
      correos: { create: [{ correo: "ventas@distribuidora.cl", descripcion: "Ventas" }] },
    },
  });
  await db.proveedor.create({
    data: {
      razonSocial: "Importadora Taiwan Bike Parts",
      rut: "11223344-5",
      giro: "Importación de componentes para bicicletas",
      condicionesDePago: "60 días",
      estado: "activo",
      telefonos: { create: [{ telefono: "+56 2 2987 6543", descripcion: "Oficina" }] },
      correos: { create: [{ correo: "import@taiwanbike.com", descripcion: "Contacto" }] },
    },
  });

  // ──────────────────────────────────────────────
  // 10. VENTAS EN MOSTRADOR
  // ──────────────────────────────────────────────
  console.log("🧾 Creando ventas en mostrador...");

  const ventasData = [
    { idUsuario: usuarios[3].idUsuario, idCliente: clientes[0].idCliente, diasAtras: 30, items: [{ idProducto: productos[6].idProducto, cantidad: 1, precioUnitario: 85000 }, { idProducto: productos[7].idProducto, cantidad: 2, precioUnitario: 12000 }] },
    { idUsuario: usuarios[3].idUsuario, idCliente: clientes[1].idCliente, diasAtras: 28, items: [{ idProducto: productos[15].idProducto, cantidad: 2, precioUnitario: 45000 }, { idProducto: productos[16].idProducto, cantidad: 1, precioUnitario: 28000 }] },
    { idUsuario: usuarios[4].idUsuario, idCliente: clientes[2].idCliente, diasAtras: 25, items: [{ idProducto: productos[4].idProducto, cantidad: 2, precioUnitario: 35000 }, { idProducto: productos[22].idProducto, cantidad: 1, precioUnitario: 8000 }] },
    { idUsuario: usuarios[4].idUsuario, idCliente: clientes[3].idCliente, diasAtras: 21, items: [{ idProducto: productos[10].idProducto, cantidad: 1, precioUnitario: 55000 }] },
    { idUsuario: usuarios[3].idUsuario, idCliente: clientes[4].idCliente, diasAtras: 18, items: [{ idProducto: productos[19].idProducto, cantidad: 3, precioUnitario: 25000 }, { idProducto: productos[20].idProducto, cantidad: 2, precioUnitario: 18000 }, { idProducto: productos[16].idProducto, cantidad: 2, precioUnitario: 28000 }] },
    { idUsuario: usuarios[4].idUsuario, idCliente: clientes[5].idCliente, diasAtras: 14, items: [{ idProducto: productos[8].idProducto, cantidad: 2, precioUnitario: 25000 }] },
    { idUsuario: usuarios[3].idUsuario, idCliente: clientes[6].idCliente, diasAtras: 10, items: [{ idProducto: productos[0].idProducto, cantidad: 1, precioUnitario: 250000 }] },
    { idUsuario: usuarios[4].idUsuario, idCliente: clientes[0].idCliente, diasAtras: 7, items: [{ idProducto: productos[25].idProducto, cantidad: 1, precioUnitario: 30000 }, { idProducto: productos[23].idProducto, cantidad: 1, precioUnitario: 20000 }] },
    { idUsuario: usuarios[3].idUsuario, idCliente: clientes[7].idCliente, diasAtras: 3, items: [{ idProducto: productos[17].idProducto, cantidad: 3, precioUnitario: 15000 }] },
    { idUsuario: usuarios[4].idUsuario, idCliente: clientes[8].idCliente, diasAtras: 1, items: [{ idProducto: productos[2].idProducto, cantidad: 1, precioUnitario: 120000 }, { idProducto: productos[4].idProducto, cantidad: 2, precioUnitario: 35000 }] },
  ];

  for (const v of ventasData) {
    const subtotal = v.items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);
    const descProductos = 0;
    const descGlobal = 0;
    const montoTotal = subtotal - descProductos - descGlobal;
    const montoNeto = Math.round(montoTotal / 1.19);
    const montoIva = montoTotal - montoNeto;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - v.diasAtras);
    fecha.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

    const venta = await db.venta.create({
      data: {
        idUsuario: v.idUsuario,
        idCliente: v.idCliente,
        fechaRegistro: fecha,
        ventaEnMostrador: {
          create: {
            estado: Math.random() > 0.3 ? "Completada" : "Pendiente",
            estadoPago: Math.random() > 0.2 ? "Pagado" : "Pendiente",
            montoSubtotal: subtotal,
            descuentoProductos: descProductos,
            descuentoGlobal: descGlobal,
            montoTotal,
            montoNeto,
            montoIva,
          },
        },
      },
    });

    for (const item of v.items) {
      const linea = await db.lineaDeVenta.create({
        data: {
          idProducto: item.idProducto,
          idVentaEnMostrador: (await db.ventaEnMostrador.findUnique({ where: { idVenta: venta.idVenta } }))!.idVentaEnMostrador,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuentoUnitario: 0,
          costoUnitario: item.precioUnitario * 0.6,
        },
      });

      const prod = await db.producto.findUnique({ where: { idProducto: item.idProducto } });
      if (prod) {
        await db.producto.update({
          where: { idProducto: item.idProducto },
          data: { stockActual: { decrement: item.cantidad } },
        });

        await db.movimientoInventario.create({
          data: {
            idLineaDeVenta: linea.idLineaDeVenta,
            fechaRegistro: fecha,
            tipoMovimiento: "Salida",
            cantidad: item.cantidad,
            costoUnitario: prod.costoPromedio,
          },
        });
      }
    }
  }
  console.log(`  ${ventasData.length} ventas en mostrador creadas.`);

  // ──────────────────────────────────────────────
  // 11. ORDENES DE TRABAJO
  // ──────────────────────────────────────────────
  console.log("🔧 Creando órdenes de trabajo...");

  const ordenesData = [
    {
      idUsuario: usuarios[0].idUsuario,
      idCliente: clientes[1].idCliente,
      idMecanico: usuarios[1].idUsuario,
      diasAtras: 20,
      estado: "Entregado",
      fechaEntregaEstimadaDias: 5,
      fechaEntregaRealDias: 5,
      items: [
        { idServicio: servicios[5].idServicio, cantidad: 1, precioUnitario: 45000 },
        { idProducto: productos[10].idProducto, cantidad: 1, precioUnitario: 55000 },
      ],
      bicicletas: [{ tipo: "MTB", marca: "Trek", modelo: "Marlin 7", color: "Rojo", descripcionAdicional: "Bicicleta MTB 29", }],
    },
    {
      idUsuario: usuarios[0].idUsuario,
      idCliente: clientes[2].idCliente,
      idMecanico: usuarios[2].idUsuario,
      diasAtras: 15,
      estado: "Listo para entregar",
      fechaEntregaEstimadaDias: 3,
      fechaEntregaRealDias: null,
      items: [
        { idServicio: servicios[7].idServicio, cantidad: 1, precioUnitario: 25000 },
        { idProducto: productos[7].idProducto, cantidad: 2, precioUnitario: 12000 },
      ],
      bicicletas: [{ tipo: "MTB", marca: "Specialized", modelo: "Rockhopper", color: "Negro", descripcionAdicional: "Bicicleta 29 ready", }],
    },
    {
      idUsuario: usuarios[0].idUsuario,
      idCliente: clientes[3].idCliente,
      idMecanico: usuarios[1].idUsuario,
      diasAtras: 10,
      estado: "En curso",
      fechaEntregaEstimadaDias: 7,
      fechaEntregaRealDias: null,
      items: [
        { idServicio: servicios[0].idServicio, cantidad: 1, precioUnitario: 15000 },
        { idServicio: servicios[1].idServicio, cantidad: 1, precioUnitario: 12000 },
        { idServicio: servicios[3].idServicio, cantidad: 1, precioUnitario: 18000 },
      ],
      bicicletas: [{ tipo: "Ruta", marca: "Giant", modelo: "Defy Advanced 2", color: "Azul", descripcionAdicional: null }],
    },
    {
      idUsuario: usuarios[0].idUsuario,
      idCliente: clientes[5].idCliente,
      idMecanico: usuarios[2].idUsuario,
      diasAtras: 5,
      estado: "Por realizar",
      fechaEntregaEstimadaDias: 10,
      fechaEntregaRealDias: null,
      items: [
        { idServicio: servicios[5].idServicio, cantidad: 1, precioUnitario: 45000 },
      ],
      bicicletas: [{ tipo: "MTB", marca: "Cannondale", modelo: "Trail 5", color: "Verde", descripcionAdicional: "Tiene ruido en pedalier" }],
    },
    {
      idUsuario: usuarios[0].idUsuario,
      idCliente: clientes[6].idCliente,
      idMecanico: usuarios[1].idUsuario,
      diasAtras: 12,
      estado: "En espera",
      fechaEntregaEstimadaDias: 2,
      fechaEntregaRealDias: null,
      items: [
        { idServicio: servicios[8].idServicio, cantidad: 1, precioUnitario: 35000 },
      ],
      bicicletas: [{ tipo: "Urbana", marca: "Mongoose", modelo: "Selter", color: "Blanco", descripcionAdicional: "Bicicleta nueva sin montaje" }],
    },
    {
      idUsuario: usuarios[0].idUsuario,
      idCliente: clientes[8].idCliente,
      idMecanico: usuarios[2].idUsuario,
      diasAtras: 2,
      estado: "Por realizar",
      fechaEntregaEstimadaDias: 7,
      fechaEntregaRealDias: null,
      items: [
        { idServicio: servicios[9].idServicio, cantidad: 1, precioUnitario: 15000 },
        { idServicio: servicios[5].idServicio, cantidad: 1, precioUnitario: 45000 },
        { idProducto: productos[8].idProducto, cantidad: 1, precioUnitario: 25000 },
      ],
      bicicletas: [{ tipo: "MTB", marca: "Scott", modelo: "Scale 940", color: "Gris", descripcionAdicional: "Cambiar cadena y service completo" }],
    },
  ];

  for (const o of ordenesData) {
    const subtotal = o.items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);
    const descProductos = 0;
    const descGlobal = 0;
    const montoTotal = subtotal - descProductos - descGlobal;
    const montoNeto = Math.round(montoTotal / 1.19);
    const montoIva = montoTotal - montoNeto;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - o.diasAtras);
    fecha.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

    const fechaEntregaEstimada = new Date(fecha);
    fechaEntregaEstimada.setDate(fechaEntregaEstimada.getDate() + o.fechaEntregaEstimadaDias);

    const fechaEntregaReal = o.fechaEntregaRealDias !== null
      ? (() => { const d = new Date(fecha); d.setDate(d.getDate() + o.fechaEntregaRealDias!); return d; })()
      : null;

    const venta = await db.venta.create({
      data: {
        idUsuario: o.idUsuario,
        idCliente: o.idCliente,
        fechaRegistro: fecha,
        ordenDeTrabajo: {
          create: {
            idMecanicoAsignado: o.idMecanico,
            estado: o.estado,
            estadoPago: o.estado === "Entregado" ? "Pagado" : "Pendiente",
            fechaEntregaEstimada,
            fechaEntregaReal: fechaEntregaReal || undefined,
            observacionesIngreso: Math.random() > 0.5 ? "Cliente solicita revisión completa" : null,
            montoSubtotal: subtotal,
            descuentoProductosServicios: descProductos,
            descuentoGlobal: descGlobal,
            montoTotal,
            montoNeto,
            montoIva,
          },
        },
      },
    });

    const ot = await db.ordenDeTrabajo.findUnique({ where: { idVenta: venta.idVenta } });

    for (const item of o.items) {
      const itemAny = item as any;
      const linea = await db.lineaDeOrdenDeTrabajo.create({
        data: {
          idOrdenDeTrabajo: ot!.idOrdenDeTrabajo,
          idServicio: itemAny.idServicio || null,
          idProducto: itemAny.idProducto || null,
          cantidad: itemAny.cantidad,
          precioUnitario: itemAny.precioUnitario,
          descuentoUnitario: 0,
          costoUnitario: itemAny.precioUnitario * 0.6,
        },
      });

      if (itemAny.idProducto) {
        await db.producto.update({
          where: { idProducto: itemAny.idProducto },
          data: { stockActual: { decrement: itemAny.cantidad } },
        });

        await db.movimientoInventario.create({
          data: {
            idLineaDeOrdenDeTrabajo: linea.idLineaDeOrdenDeTrabajo,
            fechaRegistro: fecha,
            tipoMovimiento: "Salida",
            cantidad: itemAny.cantidad,
            costoUnitario: (await db.producto.findUnique({ where: { idProducto: itemAny.idProducto } }))!.costoPromedio,
          },
        });
      }
    }

    for (const bici of o.bicicletas) {
      await db.bicicleta.create({
        data: {
          idOrdenDeTrabajo: ot!.idOrdenDeTrabajo,
          tipo: bici.tipo,
          marca: bici.marca,
          modelo: bici.modelo,
          color: bici.color,
          descripcionAdicional: bici.descripcionAdicional,
        },
      });
    }
  }
  console.log(`  ${ordenesData.length} órdenes de trabajo creadas.`);

  // ──────────────────────────────────────────────
  // 12. PAGOS (para las ventas completadas)
  // ──────────────────────────────────────────────
  console.log("💰 Creando pagos...");
  const ventasPagadas = await db.ventaEnMostrador.findMany({
    where: { estadoPago: "Pagado" },
  });
  for (const venta of ventasPagadas) {
    await db.pago.create({
      data: {
        idUsuario: usuarios[3].idUsuario,
        fechaRegistro: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
        estado: "Completado",
        metodoPago: ["Efectivo", "Débito", "Crédito", "Transferencia"][Math.floor(Math.random() * 4)],
        monto: venta.montoTotal,
        asignaciones: {
          create: {
            idVentaEnMostrador: venta.idVentaEnMostrador,
            montoAsociado: venta.montoTotal,
            tipoAbono: "Contado",
          },
        },
      },
    });
  }

  console.log("\n✅ Seed completado exitosamente!");
  console.log("   Credenciales de acceso:");
  console.log("   Admin:     admin@urbancycling.cl / admin123");
  console.log("   Mecánico:  carlos.munoz@urbancycling.cl / admin123");
  console.log("   Vendedor:  maria.gonzalez@urbancycling.cl / admin123");
  console.log("   Bodeguero: luis.fernandez@urbancycling.cl / admin123");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error durante el seed:", e);
    await db.$disconnect();
    process.exit(1);
  });
