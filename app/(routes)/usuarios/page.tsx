import { HeaderUsuarios, ListUsuarios, RolPermisoMatrix } from "./components";

export default function UsuariosPage() {
  return (
    <div className="space-y-8">
      <HeaderUsuarios />
      <ListUsuarios />

      <section aria-label="Matriz de Permisos por Rol">
        <RolPermisoMatrix />
      </section>
    </div>
  );
}
