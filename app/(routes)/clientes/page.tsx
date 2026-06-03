import { HeaderClientes } from "./components/HeaderClientes/HeaderClientes";
import { ListClientes } from "./components/ListClientes/ListClientes";

export const dynamic = "force-dynamic";

export default function ClientesPage() {
  return (
    <div>
      <HeaderClientes />
      <ListClientes />
    </div>
  );
}