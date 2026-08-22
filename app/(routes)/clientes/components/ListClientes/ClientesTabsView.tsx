"use client";

import { DataTable } from "./data-table";
import { columnsNaturales, columnsJuridicas, ClienteNatural, ClienteJuridica } from "./columns";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { User, Building2 } from "lucide-react";
import { SegmentedTabs } from "@/components/SegmentedTabs";

interface ClientesTabsViewProps {
  clientesNaturales: ClienteNatural[];
  clientesJuridicas: ClienteJuridica[];
  onViewDetails?: (id: number) => void;
}

export function ClientesTabsView({
  clientesNaturales,
  clientesJuridicas,
  onViewDetails,
}: ClientesTabsViewProps) {
  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="natural" className="w-full">
        <SegmentedTabs
          items={[
            { value: "natural", label: "Personas Naturales", icon: User, count: clientesNaturales.length },
            { value: "juridica", label: "Personas Jurídicas", icon: Building2, count: clientesJuridicas.length },
          ]}
        />

        <TabsContent value="natural" className="mt-4">
          <DataTable
            columns={columnsNaturales}
            data={clientesNaturales}
            onViewDetails={onViewDetails}
          />
        </TabsContent>

        <TabsContent value="juridica" className="mt-4">
          <DataTable
            columns={columnsJuridicas}
            data={clientesJuridicas}
            onViewDetails={onViewDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
