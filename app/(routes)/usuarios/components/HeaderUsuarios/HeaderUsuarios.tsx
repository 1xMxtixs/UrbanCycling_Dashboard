"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { ShieldCheck } from "lucide-react";

export function HeaderUsuarios() {
  return (
    <PageHeader
      title="Gestión de Usuarios"
      description="Administra los accesos, roles y permisos de las cuentas registradas en el sistema."
    />
  );
}
