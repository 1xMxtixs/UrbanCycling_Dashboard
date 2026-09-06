"use client";

import { DataTable } from "./data-table";
import { columnsNaturales, columnsJuridicas, ClienteNatural, ClienteJuridica } from "./columns";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { User, Building2 } from "lucide-react";
import { SegmentedTabs } from "@/components/forms/SegmentedTabs";

interface ClientesTabsViewProps {
  clientesNaturales: ClienteNatural[];
  clientesJuridicas: ClienteJuridica[];
  onViewDetails?: (id: number) => void;
  onViewHistory?: (id: number) => void;
}

export function ClientesTabsView({
  clientesNaturales,
  clientesJuridicas,
  onViewDetails,
  onViewHistory,
}: ClientesTabsViewProps) {
  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="natural" className="w-full space-y-6">
        <div className="flex items-center">
          <SegmentedTabs
            items={[
              {
                value: "natural",
                label: "Personas Naturales",
                icon: User,
                count: clientesNaturales.length,
              },
              {
                value: "juridica",
                label: "Personas Jurídicas",
                icon: Building2,
                count: clientesJuridicas.length,
              },
            ]}
          />
        </div>

        <TabsContent value="natural" className="mt-0 focus-visible:outline-none">
          <DataTable
            columns={columnsNaturales}
            data={clientesNaturales}
            onViewDetails={onViewDetails}
            onViewHistory={onViewHistory}
          />
        </TabsContent>

        <TabsContent value="juridica" className="mt-0 focus-visible:outline-none">
          <DataTable
            columns={columnsJuridicas}
            data={clientesJuridicas}
            onViewDetails={onViewDetails}
            onViewHistory={onViewHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
