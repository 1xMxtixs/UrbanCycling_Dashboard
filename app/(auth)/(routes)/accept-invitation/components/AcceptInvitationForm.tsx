"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatRutInput } from "@/lib/format-rut-input"

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u001F\u007F]/
const PHONE_REGEX = /^[+\d\s-]{7,20}$/

const formSchema = z
  .object({
    primerNombre: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(50, "El nombre no puede superar los 50 caracteres."),
    segundoNombre: z
      .string()
      .trim()
      .max(50, "El segundo nombre no puede superar los 50 caracteres."),
    apellidoPaterno: z
      .string()
      .trim()
      .min(1, "El apellido paterno es obligatorio.")
      .max(50, "El apellido no puede superar los 50 caracteres."),
    apellidoMaterno: z
      .string()
      .trim()
      .max(50, "El apellido no puede superar los 50 caracteres."),
    rut: z.string().trim().min(1, "El RUT es obligatorio."),
    telefono: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || PHONE_REGEX.test(value),
        "Ingresa un teléfono válido."
      ),
    contrasena: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(128, "La contraseña no puede superar los 128 caracteres.")
      .refine((value) => !CONTROL_CHARACTERS_REGEX.test(value), {
        message: "La contraseña contiene caracteres no permitidos.",
      }),
    confirmacionContrasena: z.string(),
  })
  .refine((values) => values.contrasena === values.confirmacionContrasena, {
    path: ["confirmacionContrasena"],
    message: "Las contraseñas no coinciden.",
  })

type FormValues = z.infer<typeof formSchema>

type InvitationData = {
  correo: string
  rol: {
    idRol: number
    nombre: string
  }
  expiresAt: string
}

type ApiError = {
  code?: string
  message?: string
  fields?: string[]
}

type InvitationValidationResponse = {
  data: InvitationData
}

type PageStatus =
  | "validating"
  | "valid"
  | "invalid"
  | "server-error"
  | "success"

const defaultValues: FormValues = {
  primerNombre: "",
  segundoNombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  rut: "",
  telefono: "",
  contrasena: "",
  confirmacionContrasena: "",
}

/**
 * Comprueba que un campo informado por el backend pertenezca al formulario.
 */
function isFormField(field: string): field is keyof FormValues {
  return Object.prototype.hasOwnProperty.call(defaultValues, field)
}

interface AcceptInvitationFormProps {
  token: string
}

/**
 * Valida la invitación y permite completar los datos necesarios para crear la
 * cuenta. El correo y el rol solamente se muestran; nunca se envían como
 * valores editables.
 */
export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<PageStatus>(
    token ? "validating" : "invalid"
  )
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [statusMessage, setStatusMessage] = useState(
    token ? "" : "El enlace de invitación no es válido."
  )
  const [validationAttempt, setValidationAttempt] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues,
  })
  const { isSubmitting, isValid, errors } = form.formState

  /**
   * Comprueba la invitación antes de mostrar el formulario para evitar que la
   * persona complete datos usando un enlace expirado o deshabilitado.
   */
  useEffect(() => {
    if (!token) {
      return
    }

    const controller = new AbortController()

    async function validateInvitation() {
      try {
        const response = await fetch("/api/auth/invitations/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          cache: "no-store",
          signal: controller.signal,
        })
        const result = (await response.json().catch(() => null)) as
          | InvitationValidationResponse
          | ApiError
          | null

        if (!response.ok) {
          setStatus(response.status >= 500 ? "server-error" : "invalid")
          setStatusMessage(
            (result as ApiError | null)?.message ??
              "La invitación no se encuentra disponible."
          )
          return
        }

        const invitationData = (result as InvitationValidationResponse | null)
          ?.data

        if (!invitationData) {
          throw new Error("La respuesta de la invitación no es válida.")
        }

        setInvitation(invitationData)
        setStatus("valid")
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setStatus("server-error")
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "No fue posible validar la invitación."
        )
      }
    }

    void validateInvitation()

    return () => controller.abort()
  }, [token, validationAttempt])

  /**
   * Redirige al inicio de sesión después de mostrar la confirmación de cuenta
   * creada. El botón manual permanece disponible durante la espera.
   */
  useEffect(() => {
    if (status !== "success") {
      return
    }

    const timeout = setTimeout(() => {
      router.replace("/sign-in")
    }, 2000)

    return () => clearTimeout(timeout)
  }, [router, status])

  /**
   * Reinicia la validación desde una acción explícita del usuario cuando el
   * servidor no estuvo disponible en el intento anterior.
   */
  function retryValidation() {
    setStatus("validating")
    setStatusMessage("")
    setValidationAttempt((value) => value + 1)
  }

  /**
   * Envía los datos personales y la contraseña junto con el token. El backend
   * obtiene el correo y rol desde la invitación firmada.
   */
  async function onSubmit(values: FormValues) {
    form.clearErrors()

    try {
      const response = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          primerNombre: values.primerNombre,
          segundoNombre: values.segundoNombre || null,
          apellidoPaterno: values.apellidoPaterno,
          apellidoMaterno: values.apellidoMaterno || null,
          rut: values.rut,
          telefono: values.telefono || null,
          contrasena: values.contrasena,
          confirmacionContrasena: values.confirmacionContrasena,
        }),
      })
      const result = (await response
        .json()
        .catch(() => null)) as ApiError | null

      if (!response.ok) {
        const message =
          result?.message ?? "No fue posible completar el registro."

        if (
          result?.code === "INVITACION_INVALIDA" ||
          result?.code === "INVITACION_EXPIRADA" ||
          result?.code === "INVITACION_UTILIZADA"
        ) {
          setInvitation(null)
          setStatus("invalid")
          setStatusMessage(message)
          return
        }

        const affectedFields = (result?.fields ?? []).filter(isFormField)

        for (const field of affectedFields) {
          form.setError(field, {
            type: "server",
            message,
          })
        }

        if (affectedFields[0]) {
          form.setFocus(affectedFields[0])
        }

        form.setError("root", {
          type: "server",
          message,
        })
        return
      }

      setStatus("success")
    } catch (error) {
      form.setError("root", {
        type: "server",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible completar el registro.",
      })
    }
  }

  const formattedExpiration = invitation
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(invitation.expiresAt))
    : ""

  return (
    <main className="min-h-dvh bg-[#111111] text-white">
      <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_center,#222_0,#161616_36%,#101010_72%)] px-4 py-8">
        <section className="w-full max-w-3xl">
          <div className="rounded-lg border border-white/10 bg-[#2d2d2d] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.4)] sm:p-8">
            <Link
              href="/sign-in"
              className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al inicio de sesión
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Completa tu registro</h1>
              <p className="text-sm leading-6 text-zinc-400">
                Ingresa tus datos personales y define la contraseña de tu
                cuenta.
              </p>
            </div>

            {status === "validating" && (
              <div
                role="status"
                className="mt-8 flex items-center justify-center gap-3 rounded-md border border-white/10 bg-black/10 p-8 text-zinc-300"
              >
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Validando invitación...
              </div>
            )}

            {status === "server-error" && (
              <div className="mt-8 space-y-4">
                <div
                  role="alert"
                  className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  {statusMessage}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/15 bg-transparent text-white hover:bg-white hover:text-zinc-950"
                  onClick={retryValidation}
                >
                  Intentar nuevamente
                </Button>
              </div>
            )}

            {status === "invalid" && (
              <div className="mt-8 space-y-4">
                <div
                  role="alert"
                  className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
                >
                  {statusMessage}
                </div>
                <p className="text-sm text-zinc-400">
                  Solicita al administrador una nueva invitación para continuar.
                </p>
                <Button
                  asChild
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                >
                  <Link href="/sign-in">Ir al inicio de sesión</Link>
                </Button>
              </div>
            )}

            {status === "success" && (
              <div
                role="status"
                className="mt-8 space-y-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-300"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium">
                      Tu cuenta fue creada correctamente.
                    </p>
                    <p className="mt-1 text-sm text-emerald-300/80">
                      Serás redirigido al inicio de sesión.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                >
                  <Link href="/sign-in">Ir al inicio de sesión</Link>
                </Button>
              </div>
            )}

            {status === "valid" && invitation && (
              <>
                <div className="mt-8 grid gap-3 rounded-md border border-blue-500/20 bg-blue-500/10 p-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 size-4 text-blue-300"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-blue-300/70">
                        Correo autorizado
                      </p>
                      <p className="mt-1 truncate text-sm text-blue-100">
                        {invitation.correo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className="mt-0.5 size-4 text-blue-300"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-blue-300/70">Rol asignado</p>
                      <p className="mt-1 text-sm text-blue-100">
                        {invitation.rol.nombre}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-300/70 sm:col-span-2">
                    Invitación válida hasta {formattedExpiration}.
                  </p>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-6 space-y-6"
                >
                  {errors.root?.message && (
                    <div
                      role="alert"
                      className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                    >
                      {errors.root.message}
                    </div>
                  )}

                  <section className="space-y-4 rounded-md border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center gap-2">
                      <UserRound
                        className="size-4 text-blue-400"
                        aria-hidden="true"
                      />
                      <h2 className="font-medium">Información personal</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        id="invitation-first-name"
                        label="Primer nombre *"
                        error={errors.primerNombre?.message}
                      >
                        <Input
                          id="invitation-first-name"
                          autoFocus
                          autoComplete="given-name"
                          {...form.register("primerNombre")}
                          className="h-12 border-white/5 bg-[#191919] text-white"
                        />
                      </AuthField>

                      <AuthField
                        id="invitation-middle-name"
                        label="Segundo nombre"
                        error={errors.segundoNombre?.message}
                      >
                        <Input
                          id="invitation-middle-name"
                          autoComplete="additional-name"
                          {...form.register("segundoNombre")}
                          className="h-12 border-white/5 bg-[#191919] text-white"
                        />
                      </AuthField>

                      <AuthField
                        id="invitation-last-name"
                        label="Apellido paterno *"
                        error={errors.apellidoPaterno?.message}
                      >
                        <Input
                          id="invitation-last-name"
                          autoComplete="family-name"
                          {...form.register("apellidoPaterno")}
                          className="h-12 border-white/5 bg-[#191919] text-white"
                        />
                      </AuthField>

                      <AuthField
                        id="invitation-second-last-name"
                        label="Apellido materno"
                        error={errors.apellidoMaterno?.message}
                      >
                        <Input
                          id="invitation-second-last-name"
                          {...form.register("apellidoMaterno")}
                          className="h-12 border-white/5 bg-[#191919] text-white"
                        />
                      </AuthField>

                      <AuthField
                        id="invitation-rut"
                        label="RUT *"
                        error={errors.rut?.message}
                      >
                        <Controller
                          control={form.control}
                          name="rut"
                          render={({ field }) => (
                            <Input
                              id="invitation-rut"
                              name={field.name}
                              ref={field.ref}
                              value={field.value}
                              onBlur={field.onBlur}
                              onChange={(event) =>
                                field.onChange(
                                  formatRutInput(event.target.value)
                                )
                              }
                              placeholder="12.345.678-5"
                              className="h-12 border-white/5 bg-[#191919] text-white"
                            />
                          )}
                        />
                      </AuthField>

                      <AuthField
                        id="invitation-phone"
                        label="Teléfono"
                        error={errors.telefono?.message}
                      >
                        <Input
                          id="invitation-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+56 9 1234 5678"
                          {...form.register("telefono")}
                          className="h-12 border-white/5 bg-[#191919] text-white"
                        />
                      </AuthField>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-md border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        className="size-4 text-blue-400"
                        aria-hidden="true"
                      />
                      <h2 className="font-medium">Seguridad de la cuenta</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        id="invitation-password"
                        label="Contraseña *"
                        error={errors.contrasena?.message}
                      >
                        <div className="relative">
                          <Input
                            id="invitation-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...form.register("contrasena")}
                            className="h-12 border-white/5 bg-[#191919] pr-11 text-white"
                          />
                          <VisibilityButton
                            visible={showPassword}
                            disabled={isSubmitting}
                            onClick={() => setShowPassword((value) => !value)}
                          />
                        </div>
                      </AuthField>

                      <AuthField
                        id="invitation-password-confirmation"
                        label="Confirmar contraseña *"
                        error={errors.confirmacionContrasena?.message}
                      >
                        <div className="relative">
                          <Input
                            id="invitation-password-confirmation"
                            type={showConfirmation ? "text" : "password"}
                            autoComplete="new-password"
                            {...form.register("confirmacionContrasena")}
                            className="h-12 border-white/5 bg-[#191919] pr-11 text-white"
                          />
                          <VisibilityButton
                            visible={showConfirmation}
                            disabled={isSubmitting}
                            onClick={() =>
                              setShowConfirmation((value) => !value)
                            }
                          />
                        </div>
                      </AuthField>
                    </div>

                    <p className="text-xs text-zinc-500">
                      La contraseña debe tener al menos 8 caracteres.
                    </p>
                  </section>

                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="h-14 w-full bg-white text-base font-semibold text-zinc-950 hover:bg-zinc-200"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          className="size-5 animate-spin"
                          aria-hidden="true"
                        />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear mi cuenta"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

type AuthFieldProps = {
  id: string
  label: string
  error?: string
  children: ReactNode
}

/**
 * Mantiene una presentación uniforme para etiquetas, controles y errores del
 * formulario público.
 */
function AuthField({ id, label, error, children }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type VisibilityButtonProps = {
  visible: boolean
  disabled: boolean
  onClick: () => void
}

/**
 * Permite mostrar u ocultar una contraseña sin enviar el formulario.
 */
function VisibilityButton({
  visible,
  disabled,
  onClick,
}: VisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 transition hover:text-white disabled:opacity-50"
    >
      {visible ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
