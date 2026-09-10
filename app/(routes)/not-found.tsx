import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Página no encontrada</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        La ruta a la que intentas acceder no existe o fue movida a otra sección.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Inicio
        </Link>
      </Button>
    </div>
  )
}
