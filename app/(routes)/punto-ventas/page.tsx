"use client";

import { useState } from "react";

import VentasPage from "./ventas/page";
import OrdenesTrabajoPage from "./ordenes-trabajo/page";

export default function PuntoVentasPage() {
  const [activeTab, setActiveTab] = useState<"ordenes" | "ventas">(
    "ordenes"
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-center md:justify-start">
        <div className="relative flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full max-w-md shadow-inner border border-slate-200/80 dark:border-slate-700/80">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-slate-900 shadow-md transition-all duration-300 ease-out"
            style={{
              left: activeTab === "ordenes" ? "4px" : "50%",
              width: "calc(50% - 8px)",
            }}
          />
          
          <button
            onClick={() => setActiveTab("ordenes")}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg text-center cursor-pointer ${
              activeTab === "ordenes"
                ? "text-black dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Órdenes de Trabajo
          </button>
          
          <button
            onClick={() => setActiveTab("ventas")}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg text-center cursor-pointer ${
              activeTab === "ventas"
                ? "text-black dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Ventas en Mostrador
          </button>
        </div>
      </div>

      {activeTab === "ordenes" ? (
        <OrdenesTrabajoPage />
      ) : (
        <VentasPage />
      )}
    </div>
  );
}