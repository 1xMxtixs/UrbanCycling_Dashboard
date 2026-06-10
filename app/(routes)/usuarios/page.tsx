// Pagina de administracion para visualizar usuarios y gestionar roles.
import { HeaderUsuarios } from "./components/HeaderUsuarios"
import { ListUsuarios } from "./components/ListUsuarios"

export default function UsuariosPage() {
  return (
    <div className="space-y-8">
      <HeaderUsuarios />
      <ListUsuarios />
    </div>
  )
}
