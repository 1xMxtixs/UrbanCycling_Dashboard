"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ResetPasswordFormProps = {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const timeout = setTimeout(() => {
      router.replace("/sign-in")
    }, 1800)

    return () => clearTimeout(timeout)
  }, [isSuccess, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      toast.error("El enlace de recuperación no es válido")
      return
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || "No se pudo actualizar la contraseña"
        )
      }

      setIsSuccess(true)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la contraseña"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#111111] text-white">
      <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_center,#222_0,#161616_36%,#101010_72%)] px-4 py-8">
        <section className="w-full max-w-[520px]">
          <div className="rounded-lg border border-white/10 bg-[#2d2d2d] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.4)] sm:p-8">
            <Link
              href="/sign-in"
              className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Volver al inicio de sesión
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">
                Restablecer contraseña
              </h1>
              <p className="text-sm leading-6 text-zinc-400">
                Define una nueva contraseña para volver a acceder a tu cuenta.
              </p>
            </div>

            {isSuccess ? (
              <div
                role="status"
                className="mt-8 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                  <p>
                    Tu contraseña fue actualizada correctamente. Serás
                    redirigido al inicio de sesión.
                  </p>
                </div>
              </div>
            ) : !token ? (
              <div className="mt-8 space-y-5">
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                  El enlace de recuperación no es válido. Solicita uno nuevo
                  para continuar.
                </div>

                <Button
                  asChild
                  className="h-12 w-full bg-white text-zinc-950 hover:bg-zinc-200"
                >
                  <Link href="/forgot-password">Solicitar nuevo enlace</Link>
                </Button>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <PasswordField
                  id="password"
                  label="Nueva contraseña"
                  value={password}
                  visible={showPassword}
                  disabled={isLoading}
                  onChange={setPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />

                <PasswordField
                  id="confirm-password"
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  visible={showConfirmPassword}
                  disabled={isLoading}
                  onChange={setConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                />

                <p className="text-xs text-zinc-500">
                  La contraseña debe tener al menos 8 caracteres.
                </p>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 w-full rounded-sm bg-white text-base font-semibold text-zinc-950 hover:bg-zinc-200"
                >
                  {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  visible: boolean
  disabled: boolean
  onChange: (value: string) => void
  onToggle: () => void
}

function PasswordField({
  id,
  label,
  value,
  visible,
  disabled,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        {label}
      </label>

      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required
          className="h-14 rounded-sm border-white/5 bg-[#191919] pl-12 pr-12 text-white placeholder:text-zinc-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
    </div>
  )
}
