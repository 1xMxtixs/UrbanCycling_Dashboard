"use client";

import { useState } from "react";

import InventoryPage from "../inventory/page";
import OrdenesTrabajoPage from "../ordenes-trabajo/page";

export default function PuntoVentasPage() {
  const [activeTab, setActiveTab] = useState<"ordenes" | "ventas">(
    "ordenes"
  );

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("ordenes")}
          className={`px-4 py-2 rounded-md ${
            activeTab === "ordenes"
              ? "bg-primary text-white"
              : "bg-gray-200"
          }`}
        >
          Órdenes de Trabajo
        </button>

        <button
          onClick={() => setActiveTab("ventas")}
          className={`px-4 py-2 rounded-md ${
            activeTab === "ventas"
              ? "bg-primary text-white"
              : "bg-gray-200"
          }`}
        >
          Ventas
        </button>
      </div>

      {activeTab === "ordenes" ? (
        <OrdenesTrabajoPage />
      ) : (
        <InventoryPage />
      )}
    </div>
  );
}