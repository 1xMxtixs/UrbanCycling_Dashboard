"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const GENERIC_MESSAGE =
  "Si el correo es válido, recibirás las instrucciones en breve."

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      toast.error("Ingresa tu correo electrónico")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || "No se pudo procesar la solicitud"
        )
      }

      setSubmitted(true)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo procesar la solicitud"
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
              <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
              <p className="text-sm leading-6 text-zinc-400">
                Ingresa el correo asociado a tu cuenta y te enviaremos un enlace
                para restablecer tu contraseña.
              </p>
            </div>

            {submitted ? (
              <div
                role="status"
                className="mt-8 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                  <p>{GENERIC_MESSAGE}</p>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="forgot-password-email"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="forgot-password-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nombre@ejemplo.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isLoading}
                      required
                      className="h-14 rounded-sm border-white/5 bg-[#191919] pl-12 text-white placeholder:text-zinc-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 w-full rounded-sm bg-white text-base font-semibold text-zinc-950 hover:bg-zinc-200"
                >
                  {isLoading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            )}

            {submitted && (
              <Button
                asChild
                variant="outline"
                className="mt-6 h-11 w-full border-white/15 bg-transparent text-white hover:bg-white hover:text-zinc-950"
              >
                <Link href="/sign-in">Volver al inicio de sesión</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
