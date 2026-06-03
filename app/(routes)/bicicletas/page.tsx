"use client"

import { HeaderBicicletas } from "./components/HeaderBicicletas";
import { ListBicicletas } from "./components/ListBicicletas";

export default function BicicletasPage() {
  return (
    <div className="space-y-8">
      <HeaderBicicletas />
      <ListBicicletas />
    </div>
  );
}
