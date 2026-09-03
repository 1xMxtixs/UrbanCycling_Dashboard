import { HeaderUsuarios, ListUsuarios, RolPermisoMatrix } from "./components";


export default function UsuariosPage() {
  return (
    <div className="min-h-full space-y-8">
      <HeaderUsuarios />
      <ListUsuarios />

      {/* Sección de permisos por rol */}
      <section aria-labelledby="roles-matrix-heading" className="space-y-3">
        <div>
          <h2
            id="roles-matrix-heading"
            className="text-base font-bold text-foreground"
          >
            Seguridad y Control de Acceso
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Permisos habilitados por rol en el sistema
          </p>
        </div>
        <RolPermisoMatrix />
      </section>
    </div>
  );
}

