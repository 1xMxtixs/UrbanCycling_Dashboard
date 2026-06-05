"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "register"

function formatRut(value: string) {
  const cleaned = value
    .toUpperCase()
    .replace(/[^0-9K]/g, "")
    .slice(0, 9)

  if (cleaned.length <= 1) {
    return cleaned
  }

  const body = cleaned.slice(0, -1)
  const checkDigit = cleaned.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${formattedBody}-${checkDigit}`
}

function splitNames(value: string) {
  const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)

  return {
    primerNombre: parts[0] ?? "",
    segundoNombre: parts.slice(1).join(" ") || null,
  }
}

function splitSurnames(value: string) {
  const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)

  return {
    apellidoPaterno: parts[0] ?? "",
    apellidoMaterno: parts.slice(1).join(" "),
  }
}

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rut, setRut] = useState("")
  const [names, setNames] = useState("")
  const [surnames, setSurnames] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const isLogin = mode === "login"
  const submitLabel = useMemo(
    () => (isLogin ? "Acceder al Panel" : "Crear cuenta"),
    [isLogin]
  )

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode)
    setShowPassword(false)
  }

  const handleLogin = async () => {
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (response?.error) {
      throw new Error("Correo o contrasena incorrectos")
    }

    router.push("/")
    router.refresh()
  }

  const handleRegister = async () => {
    const { primerNombre, segundoNombre } = splitNames(names)
    const { apellidoPaterno, apellidoMaterno } = splitSurnames(surnames)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rut,
        primerNombre,
        segundoNombre,
        apellidoPaterno,
        apellidoMaterno,
        correoElectronico: email,
        contrasena: password,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "No se pudo crear la cuenta")
    }

    toast.success("Cuenta creada correctamente")
    await handleLogin()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { primerNombre } = splitNames(names)
    const { apellidoPaterno, apellidoMaterno } = splitSurnames(surnames)

    const missingRegisterFields =
      !isLogin && (!rut || !primerNombre || !apellidoPaterno || !apellidoMaterno)

    if (!email || !password || missingRegisterFields) {
      toast.error("Completa los campos obligatorios")
      return
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        await handleLogin()
      } else {
        await handleRegister()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo procesar la solicitud"
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
              Gestion inteligente para el ciclista moderno
            </p>
          </div>

          <div className="w-full rounded-lg border border-white/10 bg-[#2d2d2d] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.4)] sm:p-7">
            <div className="mb-6 grid grid-cols-2 rounded-md border border-white/10 bg-[#1b1b1b] p-1">
              <button
                type="button"
                className={cn(
                  "h-9 rounded-sm text-sm font-medium text-zinc-400 transition",
                  isLogin && "bg-white text-zinc-950"
                )}
                onClick={() => handleModeChange("login")}
              >
                Iniciar sesion
              </button>
              <button
                type="button"
                className={cn(
                  "h-9 rounded-sm text-sm font-medium text-zinc-400 transition",
                  !isLogin && "bg-white text-zinc-950"
                )}
                onClick={() => handleModeChange("register")}
              >
                Registro
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthField
                    icon={<User className="size-4" />}
                    label="Rut"
                    name="rut"
                    placeholder="11.111.111-1"
                    value={rut}
                    onChange={(event) => setRut(formatRut(event.target.value))}
                  />
                  <AuthField
                    icon={<User className="size-4" />}
                    label="Nombre(s)"
                    name="names"
                    placeholder="Nombre"
                    value={names}
                    onChange={(event) => setNames(event.target.value)}
                  />
                  <AuthField
                    icon={<User className="size-4" />}
                    label="Apellidos"
                    name="surnames"
                    placeholder="Paterno Materno"
                    value={surnames}
                    onChange={(event) => setSurnames(event.target.value)}
                    wrapperClassName="sm:col-span-2"
                  />
                </div>
              )}

              <AuthField
                icon={<Mail className="size-4" />}
                label="Correo electronico"
                name="email"
                placeholder="nombre@ejemplo.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <div className="space-y-2">
                <label
                  className="text-sm font-medium uppercase text-zinc-200"
                  htmlFor="password"
                >
                  Contrasena
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-14 rounded-sm border-white/5 bg-[#191919] pl-12 pr-12 text-base text-white placeholder:text-zinc-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-sm bg-white text-base font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                {isLoading ? "Procesando..." : submitLabel}
                {!isLoading && <ArrowRight className="size-5" />}
              </Button>
            </form>

            {!isLogin && (
              <>
                <div className="my-7 h-px bg-white/10" />

                <div className="text-center">
                  <p className="text-sm text-zinc-300">
                    Ya tienes una cuenta administrativa?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 h-11 rounded-md border-white/15 bg-transparent px-8 text-sm font-medium uppercase text-white hover:bg-white hover:text-zinc-950"
                    onClick={() => handleModeChange("login")}
                  >
                    Iniciar sesion
                  </Button>
                </div>
              </>
            )}
          </div>

          <footer className="mt-10 text-center text-sm uppercase tracking-[0.18em] text-zinc-600">
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
        className="text-sm font-medium uppercase text-zinc-200"
        htmlFor={props.name}
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
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
