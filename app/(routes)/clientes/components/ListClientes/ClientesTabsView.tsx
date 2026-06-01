"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { columnsNaturales, columnsJuridicas, ClienteNatural, ClienteJuridica } from "./columns";

interface ClientesTabsViewProps {
  clientesNaturales: ClienteNatural[];
  clientesJuridicas: ClienteJuridica[];
}

export function ClientesTabsView({
  clientesNaturales,
  clientesJuridicas,
}: ClientesTabsViewProps) {
  const [activeTab, setActiveTab] = useState<"natural" | "juridica">("natural");

  return (
    <div className="w-full space-y-4">
      {/* Premium Sliding Tabs Header */}
      <div className="flex justify-center md:justify-start">
        <div className="relative flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full max-w-md shadow-inner border border-slate-200/80 dark:border-slate-700/80">
          {/* Animated Background Indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-slate-900 shadow-md transition-all duration-300 ease-out"
            style={{
              left: activeTab === "natural" ? "4px" : "50%",
              width: "calc(50% - 8px)",
            }}
          />
          
          <button
            onClick={() => setActiveTab("natural")}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg text-center cursor-pointer ${
              activeTab === "natural"
                ? "text-black dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Personas Naturales
          </button>
          
          <button
            onClick={() => setActiveTab("juridica")}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg text-center cursor-pointer ${
              activeTab === "juridica"
                ? "text-black dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Personas Jurídicas
          </button>
        </div>
      </div>

      {/* Render selected table with smooth transition */}
      <div className="transition-all duration-300 ease-in-out">
        {activeTab === "natural" ? (
          <div className="animate-in fade-in duration-300">
            <DataTable
              columns={columnsNaturales}
              data={clientesNaturales}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <DataTable
              columns={columnsJuridicas}
              data={clientesJuridicas}
            />
          </div>
        )}
      </div>
    </div>
  );
}
