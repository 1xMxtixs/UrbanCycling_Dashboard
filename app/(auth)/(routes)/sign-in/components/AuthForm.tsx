"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function AuthForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  /**
   * Inicia la sesión con credenciales y redirige al panel cuando NextAuth
   * confirma la identidad del usuario.
   */
  async function handleLogin() {
    const response = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    if (response?.error) {
      throw new Error("Correo o contraseña incorrectos.")
    }

    router.push("/")
    router.refresh()
  }

  /**
   * Valida los campos mínimos y controla el estado visual durante el inicio de
   * sesión. La creación pública de cuentas ya no forma parte de este flujo.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password) {
      toast.error("Ingresa tu correo y contraseña.")
      return
    }

    setIsLoading(true)

    try {
      await handleLogin()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#111111] text-white">
      <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_center,#222_0,#161616_36%,#101010_72%)] px-4 py-8">
        <section className="flex w-full max-w-[520px] flex-col items-center">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-7 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Urban Cycling"
                width={64}
                height={64}
                priority
              />
            </div>
            <h1 className="text-lg font-semibold">Urban Cycling</h1>
            <p className="mt-2 text-base text-zinc-300">
              Gestión inteligente para el ciclista moderno
            </p>
          </div>

          <div className="w-full rounded-lg border border-white/10 bg-[#2d2d2d] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.4)] sm:p-7">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-white">
                Acceso administrativo
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <AuthField
                icon={<Mail className="size-4" />}
                label="Correo electrónico"
                name="email"
                placeholder="nombre@ejemplo.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-200 uppercase"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-14 rounded-sm border-white/5 bg-[#191919] pr-12 pl-12 text-base text-white placeholder:text-zinc-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="-mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 transition hover:text-blue-300 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-sm bg-white text-base font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                {isLoading ? "Accediendo..." : "Acceder al panel"}
                {!isLoading && <ArrowRight className="size-5" />}
              </Button>
            </form>
          </div>

          <footer className="mt-10 text-center text-sm tracking-[0.18em] text-zinc-600 uppercase">
            <span className="text-blue-700">-</span> UC-Core v2.4.0
            <span className="mx-4">Copyright 2026 Urban Cycling Inc.</span>
          </footer>
        </section>
      </div>
    </main>
  )
}

type AuthFieldProps = React.ComponentProps<"input"> & {
  icon: React.ReactNode
  label: string
  wrapperClassName?: string
}

/**
 * Renderiza un campo visual del formulario de acceso manteniendo icono,
 * etiqueta, foco y estilos coherentes con la pantalla de autenticación.
 */
function AuthField({
  icon,
  label,
  className,
  wrapperClassName,
  ...props
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <label
        className="text-sm font-medium text-zinc-200 uppercase"
        htmlFor={props.name}
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500">
          {icon}
        </span>
        <Input
          id={props.name}
          className={cn(
            "h-14 rounded-sm border-white/5 bg-[#191919] pl-12 text-base text-white placeholder:text-zinc-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20",
            className
          )}
          {...props}
        />
      </div>
    </div>
  )
}
