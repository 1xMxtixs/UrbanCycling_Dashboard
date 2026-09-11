import { describe, it } from "vitest";
import { testEndpointProtection } from "../utils/permission-harness";

// --- IMPORTACIONES DE ENDPOINTS ---
// Ventas y Órdenes
import { GET as getVentas, POST as postVentas } from "@/app/api/ventas/route";
import { GET as getOrdenes, POST as postOrdenes } from "@/app/api/ordenes-trabajo/route";
import { PATCH as patchOrdenEstado } from "@/app/api/ordenes-trabajo/[idVenta]/estado/route";

// Inventario
import { GET as getInventory, POST as postInventory } from "@/app/api/inventory/route";
import { GET as getInventoryById, PATCH as patchInventoryById, DELETE as deleteInventoryById } from "@/app/api/inventory/[id]/route";

// Clientes y Bicicletas
import { GET as getClientes, POST as postClientes } from "@/app/api/clientes/route";
import { GET as getBicycles, POST as postBicycles } from "@/app/api/bicycles/route";
import { GET as getBicycleById, PATCH as patchBicycleById, DELETE as deleteBicycleById } from "@/app/api/bicycles/[id]/route";

// Usuarios y Roles
import { GET as getUsers } from "@/app/api/users/route";
import { PATCH as patchUserRole, DELETE as deleteUserRole } from "@/app/api/users/[id]/role/route";
import { GET as getRoles } from "@/app/api/roles/route";

// Otros
import { POST as postDocs } from "@/app/api/documentos-tributarios/route";
import { GET as getReporte } from "@/app/api/ventas/reporte-diario/route";


describe("Pruebas de Seguridad (Harness) - UC-95", () => {
  
  describe("Rutas de Ventas e Ingresos", () => {
    it("debe bloquear GET y POST en /api/ventas", async () => {
      await testEndpointProtection(getVentas, "GET");
      await testEndpointProtection(postVentas, "POST", { id_cliente: 1, productos: [] });
    });

    it("debe bloquear GET en reporte diario", async () => {
      await testEndpointProtection(getReporte, "GET");
    });
  });

  describe("Rutas de Órdenes de Trabajo", () => {
    it("debe bloquear GET y POST en /api/ordenes-trabajo", async () => {
      await testEndpointProtection(getOrdenes, "GET");
      await testEndpointProtection(postOrdenes, "POST", { idUsuario: 1 });
    });

    it("debe bloquear PATCH en cambio de estado de orden", async () => {
      await testEndpointProtection(patchOrdenEstado, "PATCH", { estado: "En curso" }, { idVenta: "1" });
    });
  });

  describe("Rutas de Inventario", () => {
    it("debe bloquear peticiones a la colección general", async () => {
      await testEndpointProtection(getInventory, "GET");
      await testEndpointProtection(postInventory, "POST", { nombre: "Producto Test" });
    });

    it("debe bloquear peticiones a elementos específicos [id]", async () => {
      const params = { id: "1" };
      await testEndpointProtection(getInventoryById, "GET", {}, params);
      await testEndpointProtection(patchInventoryById, "PATCH", { stockActual: 10 }, params);
      await testEndpointProtection(deleteInventoryById, "DELETE", {}, params);
    });
  });

  describe("Rutas de Clientes y Bicicletas", () => {
    it("debe bloquear operaciones de clientes", async () => {
      await testEndpointProtection(getClientes, "GET");
      await testEndpointProtection(postClientes, "POST", { rut: "123", telefono: "999" });
    });

    it("debe bloquear operaciones de bicicletas", async () => {
      await testEndpointProtection(getBicycles, "GET");
      await testEndpointProtection(postBicycles, "POST", { marca: "Trek" });
      
      const params = { id: "1" };
      await testEndpointProtection(getBicycleById, "GET", {}, params);
      await testEndpointProtection(patchBicycleById, "PATCH", { color: "Rojo" }, params);
      await testEndpointProtection(deleteBicycleById, "DELETE", {}, params);
    });
  });

  describe("Rutas Administrativas (Usuarios, Roles, Tributario)", () => {
    it("debe bloquear acceso a usuarios y roles", async () => {
      await testEndpointProtection(getUsers, "GET");
      await testEndpointProtection(getRoles, "GET");
      
      const params = { id: "1" };
      await testEndpointProtection(patchUserRole, "PATCH", { idRol: 2 }, params);
      await testEndpointProtection(deleteUserRole, "DELETE", {}, params);
    });

    it("debe bloquear generación de documentos tributarios", async () => {
      await testEndpointProtection(postDocs, "POST", { origen: "venta" });
    });
  });

});