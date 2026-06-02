import { ClientesTabsView } from "./ClientesTabsView"
import { db } from "@/lib/db"
import { ClienteNatural, ClienteJuridica } from "./columns"

export async function ListClientes() {
  const dbClientes = await db.cliente.findMany({
    orderBy: {
      fechaCreacion: "desc",
    },
    include: {
      telefonos: true,
    },
  });

  // Segregar y mapear clientes de Persona Natural
  const clientesNaturales: ClienteNatural[] = dbClientes
    .filter((c) => c.tipoCliente === "natural")
    .map((c) => {
      const nombreComp = [c.primerNombre, c.segundoNombre].filter(Boolean).join(" ");
      const apellidoComp = [c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");
      const telefonoComp = c.telefonos[0]?.telefono || "No especificado";

      return {
        id: c.idCliente,
        nombre: nombreComp || "Sin nombre",
        apellido: apellidoComp || "Sin apellido",
        rut: c.rut,
        telefono: telefonoComp,
        estado: c.estado,
      };
    });

  // Segregar y mapear clientes de Persona Jurídica
  const clientesJuridicas: ClienteJuridica[] = dbClientes
    .filter((c) => c.tipoCliente === "juridica")
    .map((c) => {
      const telefonoComp = c.telefonos[0]?.telefono || "No especificado";

      return {
        id: c.idCliente,
        nombre: c.razonSocial || "Sin razón social",
        giro: c.giro || "No especificado",
        nombreContacto: c.nombreContacto || "No especificado",
        rut: c.rut,
        telefono: telefonoComp,
        estado: c.estado,
      };
    });

  return (
    <ClientesTabsView
      clientesNaturales={clientesNaturales}
      clientesJuridicas={clientesJuridicas}
    />
  );
}