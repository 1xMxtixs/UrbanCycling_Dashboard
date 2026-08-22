"use client";

import { useState } from "react";

import VentasPage from "./ventas/page";
import OrdenesTrabajoPage from "./ordenes-trabajo/page";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SegmentedTabs } from "@/components/SegmentedTabs";

export default function PuntoVentasPage() {
  const [activeTab, setActiveTab] = useState<"ordenes" | "ventas">(
    "ordenes"
  );

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "ordenes" | "ventas")}
        className="w-full"
      >
        <SegmentedTabs
          items={[
            { value: "ordenes", label: "Órdenes de Trabajo" },
            { value: "ventas", label: "Ventas en Mostrador" },
          ]}
        />
        <TabsContent value="ordenes" className="mt-6">
          <OrdenesTrabajoPage />
        </TabsContent>
        <TabsContent value="ventas" className="mt-6">
          <VentasPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}