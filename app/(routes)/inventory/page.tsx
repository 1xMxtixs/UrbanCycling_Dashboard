import { Suspense } from "react"
import { HeaderInventory } from "./components/HeaderInventory"
import { ListInventory } from "./components/ListInventory"
import { ListMovements } from "./components/ListMovements"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderInventory />
      <Tabs defaultValue="productos" className="w-full space-y-6">
        <TabsList className="h-10 p-1 bg-muted/80 rounded-xl">
          <TabsTrigger value="productos" className="rounded-lg px-4 py-1.5 text-sm font-medium">
            Productos
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="rounded-lg px-4 py-1.5 text-sm font-medium">
            Movimientos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="productos" className="mt-0 space-y-6 focus-visible:outline-none">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <ListInventory />
          </Suspense>
        </TabsContent>
        <TabsContent value="movimientos" className="mt-0 space-y-6 focus-visible:outline-none">
          <ListMovements />
        </TabsContent>
      </Tabs>
    </div>
  )
}

