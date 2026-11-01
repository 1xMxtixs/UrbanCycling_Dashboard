import { HeaderUsuarios, ListUsuarios, RolPermisoMatrix } from "./components";

export default function UsuariosPage() {
  return (
    <div className="space-y-8">
      <HeaderUsuarios />
      <ListUsuarios />

      <RolPermisoMatrix />
    </div>
  );
}
