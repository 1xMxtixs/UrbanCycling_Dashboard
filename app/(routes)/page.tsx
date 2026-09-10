"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Store,
  Package,
  Bike,
  Users,
  ArrowRight,
  TrendingUp,
  Wrench,
  Receipt,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { data: session } = useSession()

  const userName = session?.user?.name
    ? session.user.name.split(" ")[0]
    : "Equipo"

  // Quick Access Modules
  const quickLinks = [
    {
      title: "Punto de Venta",
      subtitle: "Caja & Mostrador",
      description: "Genera ventas directas, cobros y emite boletas en tiempo real.",
      href: "/punto-ventas",
      icon: Store,
      badge: "Activo",
      badgeStatus: "success",
    },
    {
      title: "Órdenes de Trabajo",
      subtitle: "Taller Mecánico",
      description: "Recepción de bicicletas, diagnósticos y seguimiento técnico.",
      href: "/punto-ventas/ordenes-trabajo",
      icon: Wrench,
      badge: "En curso",
      badgeStatus: "info",
    },
    {
      title: "Inventario",
      subtitle: "Stock & Repuestos",
      description: "Control de existencias, productos, precios y categorías.",
      href: "/inventory",
      icon: Package,
      badge: "Al día",
      badgeStatus: "neutral",
    },
    {
      title: "Clientes & Bicis",
      subtitle: "Directorio",
      description: "Fichas de clientes, historial de visitas y bicicletas asociadas.",
      href: "/clientes",
      icon: Users,
      badge: "Gestión",
      badgeStatus: "neutral",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. Header con Saludo y Resumen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-linear-to-r from-card via-card to-primary/5 border border-border/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Panel de Gestión Urban Cycling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            ¡Hola, {userName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Bienvenido a tu panel de control. Monitorea las operaciones del taller, ventas y estado del inventario en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <Button asChild className="rounded-xl shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/punto-ventas">
              <Store className="h-4 w-4 mr-2" />
              Ir a Punto de Venta
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. KPIs de Alto Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas de Hoy"
          value="$184.990"
          description="Total transacciones en caja"
          icon={TrendingUp}
          trend={{ value: "+12.4%", isPositive: true }}
        />
        <MetricCard
          title="Taller en Proceso"
          value="8"
          description="Bicicletas en mantenimiento"
          icon={Wrench}
          trend={{ value: "3 listas hoy", isPositive: true }}
        />
        <MetricCard
          title="Catálogo & Stock"
          value="142"
          description="Productos registrados"
          icon={Package}
        />
        <MetricCard
          title="Clientes Frecuentes"
          value="95"
          description="Clientes registrados"
          icon={Users}
        />
      </div>

      {/* 3. Módulos Principales & Acciones Rápidas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Módulos Principales
            </h2>
            <p className="text-xs text-muted-foreground">
              Acceso directo a las áreas de trabajo más utilizadas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.href}
                className="group relative flex flex-col justify-between overflow-hidden border-border/80 bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
              >
                {/* Subtle top brand glow */}
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="pb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-2xs">
                      <Icon className="h-5 w-5 stroke-[1.9]" />
                    </div>
                    <StatusBadge status={item.badgeStatus} label={item.badge} showDot={false} />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 block">
                      {item.subtitle}
                    </span>
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between rounded-xl bg-muted/30 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                  >
                    <Link href={item.href}>
                      <span className="text-xs font-semibold">Ingresar al módulo</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 4. Panel de Estado Operativo & Taller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado del Taller */}
        <Card className="lg:col-span-2 border-border/80 bg-card/90 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Resumen de Operación del Taller
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Capacidad y flujo de trabajo de servicio técnico
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="xs" className="rounded-lg text-xs">
              <Link href="/punto-ventas/ordenes-trabajo">Ver todas</Link>
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pendientes</span>
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-2">3</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">Por recepcionar/diagnosticar</p>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">En Reparación</span>
                  <Wrench className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100 mt-2">5</p>
                <p className="text-[11px] text-cyan-700/80 dark:text-cyan-300/80 mt-0.5">Con mecánico asignado</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Para Retiro</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">4</p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">Listas para entregar</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground">Taller Operativo</span>
                <span className="text-muted-foreground hidden sm:inline">• Capacidad disponible para nuevas recepciones</span>
              </div>
              <Button asChild size="xs" className="rounded-lg bg-primary text-primary-foreground text-xs">
                <Link href="/punto-ventas/ordenes-trabajo">+ Nueva Orden</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Atajos de Control & Boletas */}
        <Card className="border-border/80 bg-card/90 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Gestión Documental
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Accesos rápidos a registros y comprobantes
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <Link
                href="/historial-boletas"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Historial de Boletas</p>
                    <p className="text-[11px] text-muted-foreground">Consulta DTEs y boletas emitidas</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/bicicletas"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Bike className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Registro de Bicicletas</p>
                    <p className="text-[11px] text-muted-foreground">Catálogo de números de serie y marcas</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-muted-foreground text-center">
                Sistema sincronizado en tiempo real
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}