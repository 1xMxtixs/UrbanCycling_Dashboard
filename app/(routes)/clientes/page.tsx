import { Suspense } from "react";
import { HeaderClientes, ListClientes } from "./components";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function ClientesPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderClientes />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <ListClientes />
      </Suspense>
    </div>
  );
}

