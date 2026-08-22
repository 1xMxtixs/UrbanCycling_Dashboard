import { PageHeader } from "@/components/PageHeader"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Store, Package, Bike, Users, ArrowRight } from "lucide-react"

export default function Page() {
  const quickLinks = [
    {
      title: "Punto de Venta",
      description: "Gestiona ventas en mostrador y órdenes de trabajo",
      href: "/punto-ventas",
      icon: Store,
    },
    {
      title: "Inventario",
      description: "Consulta stock, productos, precios y movimientos",
      href: "/inventory",
      icon: Package,
    },
    {
      title: "Clientes",
      description: "Administra el directorio de clientes y sus datos",
      href: "/clientes",
      icon: Users,
    },
    {
      title: "Bicicletas",
      description: "Control de bicicletas registradas y taller",
      href: "/bicicletas",
      icon: Bike,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bienvenido a Urban Cycling"
        description="Panel de control general para la gestión de ventas, inventario y taller."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.href} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link href={item.href}>
                    Ingresar <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}