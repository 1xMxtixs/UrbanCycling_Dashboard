"use client"

import { useEffect, useState } from "react";
import { HeaderBicicletas } from "./components/HeaderBicicletas";
import { ListBicicletas } from "./components/ListBicicletas";
import type { Bicicleta } from "./components/ListBicicletas/columns";

export default function BicicletasPage() {
  const [bicicletas, setBicicletas] = useState<Bicicleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchBicicletas();
  }, []);

  const fetchBicicletas = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bicycles");

      if (!response.ok) {
        throw new Error("No se pudieron cargar las bicicletas");
      }

      const data: Bicicleta[] = await response.json();
      setBicicletas(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cargar bicicletas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBicicleta = async (bicicleta: Omit<Bicicleta, "id">) => {
    const response = await fetch("/api/bicycles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bicicleta),
    });

    if (!response.ok) {
      throw new Error("No se pudo crear la bicicleta");
    }

    const createdBicycle: Bicicleta = await response.json();
    setBicicletas((prev) => [createdBicycle, ...prev]);
  };

  return (
    <div className="space-y-8">
      <HeaderBicicletas onAddBicicleta={handleAddBicicleta} />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md">
          Cargando bicicletas...
        </div>
      ) : (
        <ListBicicletas bicicletas={bicicletas} />
      )}
    </div>
  );
}
