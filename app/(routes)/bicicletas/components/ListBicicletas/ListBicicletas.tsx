"use client"

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns, type Bicicleta } from "./columns";

export function ListBicicletas() {
  const [bicicletas, setBicicletas] = useState<Bicicleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBicicletas = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/bicycles", { cache: "no-store" });

        if (!response.ok) {
          setBicicletas([]);
          return;
        }

        const data = (await response.json()) as Bicicleta[];
        setBicicletas(data);
      } catch {
        setBicicletas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBicicletas();
    window.addEventListener("bicicletas:refresh", fetchBicicletas);

    return () => {
      window.removeEventListener("bicicletas:refresh", fetchBicicletas);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md">
        Cargando bicicletas...
      </div>
    );
  }

  return <DataTable columns={columns} data={bicicletas} />;
}
