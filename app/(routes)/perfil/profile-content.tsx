"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import { toast } from "sonner"
import { Check, Edit3, Mail, Save, ShieldCheck, UserRound, X } from "lucide-react"

type Profile = {
  idUsuario: number
  primerNombre: string
  segundoNombre: string | null
  apellidoPaterno: string
  apellidoMaterno: string | null
  rut: string
  correo: string | null
  telefono: string | null
  estado: string
  rol: { idRol: number; nombre: string; descripcion: string | null }
}

type EditableField =
  | "primerNombre"
  | "segundoNombre"
  | "apellidoPaterno"
  | "apellidoMaterno"
  | "correo"
  | "telefono"

type FormValues = Record<EditableField, string>

const editableFields: EditableField[] = [
  "primerNombre",
  "segundoNombre",
  "apellidoPaterno",
  "apellidoMaterno",
  "correo",
  "telefono",
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+\d\s-]{7,20}$/
const sessionFields: EditableField[] = [
  "primerNombre",
  "segundoNombre",
  "apellidoPaterno",
  "apellidoMaterno",
  "correo",
]
const invalidFieldMessages: Record<EditableField, string> = {
  primerNombre: "Ingresa un primer nombre de hasta 50 caracteres.",
  segundoNombre: "El segundo nombre debe tener como máximo 50 caracteres.",
  apellidoPaterno: "Ingresa un apellido paterno de hasta 50 caracteres.",
  apellidoMaterno: "El apellido materno debe tener como máximo 50 caracteres.",
  correo: "Ingresa un correo válido de hasta 255 caracteres.",
  telefono: "Ingresa un teléfono válido de hasta 20 caracteres.",
}

function toFormValues(profile: Profile): FormValues {
  return {
    primerNombre: profile.primerNombre,
    segundoNombre: profile.segundoNombre ?? "",
    apellidoPaterno: profile.apellidoPaterno,
    apellidoMaterno: profile.apellidoMaterno ?? "",
    correo: profile.correo ?? "",
    telefono: profile.telefono ?? "",
  }
}

function getInitials(profile: Profile) {
  return `${profile.primerNombre[0] ?? ""}${profile.apellidoPaterno[0] ?? ""}`.toUpperCase()
}

function displayName(profile: Profile) {
  return [
    profile.primerNombre,
    profile.segundoNombre,
    profile.apellidoPaterno,
    profile.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
}

function Field({
  label,
  name,
  value,
  placeholder,
  disabled,
  error,
  onChange,
  type = "text",
}: {
  label: string
  name: EditableField
  value: string
  placeholder?: string
  disabled: boolean
  error?: string
  onChange: (name: EditableField, value: string) => void
  type?: "text" | "email" | "tel"
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-foreground">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function ProfileContent() {
  const { update } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formValues, setFormValues] = useState<FormValues | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditableField, string>>>({})

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      try {
        const response = await fetch("/api/perfil", { signal: controller.signal })
        if (!response.ok) throw new Error("No fue posible cargar tu información de perfil.")

        const data = (await response.json()) as Profile
        setProfile(data)
        setFormValues(toFormValues(data))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setLoadError(error instanceof Error ? error.message : "Ocurrió un error al cargar el perfil.")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadProfile()
    return () => controller.abort()
  }, [])

  const changes = useMemo(() => {
    if (!profile || !formValues) return {}

    return editableFields.reduce<Partial<Record<EditableField, string | null>>>((result, field) => {
      const value = formValues[field].trim()
      const normalizedValue = field === "segundoNombre" || field === "apellidoMaterno" || field === "telefono"
        ? value || null
        : value
      const currentValue = profile[field]

      if (normalizedValue !== currentValue) result[field] = normalizedValue
      return result
    }, {})
  }, [formValues, profile])

  function updateField(name: EditableField, value: string) {
    setFormValues((current) => (current ? { ...current, [name]: value } : current))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validate() {
    if (!formValues) return false
    const errors: Partial<Record<EditableField, string>> = {}

    if (!formValues.primerNombre.trim()) errors.primerNombre = "El primer nombre es obligatorio."
    if (!formValues.apellidoPaterno.trim()) errors.apellidoPaterno = "El apellido paterno es obligatorio."
    if (!EMAIL_REGEX.test(formValues.correo.trim())) errors.correo = "Ingresa un correo válido."
    if (formValues.telefono.trim() && !PHONE_REGEX.test(formValues.telefono.trim())) {
      errors.telefono = "Ingresa un teléfono válido."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function cancelEditing() {
    if (profile) setFormValues(toFormValues(profile))
    setFieldErrors({})
    setIsEditing(false)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    if (Object.keys(changes).length === 0) {
      toast.info("No hay cambios para guardar.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errorData = data as { code?: unknown; fields?: unknown; message?: unknown } | null
        const fields = Array.isArray(errorData?.fields) ? errorData.fields : []
        const errors = fields.reduce<Partial<Record<EditableField, string>>>((result, field) => {
          if (typeof field === "string" && editableFields.includes(field as EditableField)) {
            const editableField = field as EditableField
            result[editableField] =
              errorData?.code === "CAMPOS_INVALIDOS"
                ? invalidFieldMessages[editableField]
                : typeof errorData?.message === "string"
                  ? errorData.message
                  : "Revisa este campo."
          }
          return result
        }, {})
        setFieldErrors(errors)
        throw new Error(
          typeof errorData?.message === "string"
            ? errorData.message
            : "No fue posible guardar los cambios.",
        )
      }

      const updatedProfile = data as Profile
      setProfile(updatedProfile)
      setFormValues(toFormValues(updatedProfile))
      setFieldErrors({})
      setIsEditing(false)

      const requiresSessionRefresh = sessionFields.some((field) =>
        Object.prototype.hasOwnProperty.call(changes, field),
      )

      if (requiresSessionRefresh) {
        try {
          await update()
        } catch {
          toast.warning(
            "Tu perfil se guardó, pero no pudimos actualizar el menú. Recarga la página.",
          )
        }
      }

      toast.success("Tu perfil se actualizó correctamente.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error inesperado.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!profile || !formValues) {
    return (
      <Card className="border-destructive/25 bg-destructive/5">
        <CardHeader>
          <CardTitle>No pudimos cargar tu perfil</CardTitle>
          <CardDescription>{loadError || "Intenta nuevamente más tarde."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="Mi perfil"
        description="Consulta y actualiza tus datos personales y de contacto."
      >
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="h-4 w-4" />
            Editar perfil
          </Button>
        ) : (
          <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 bg-card/90 shadow-xs lg:col-span-1">
          <CardHeader className="items-center border-b border-border/60 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-sm">
              {getInitials(profile)}
            </div>
            <div className="space-y-1 pt-2">
              <CardTitle className="text-lg font-bold">{displayName(profile)}</CardTitle>
              <CardDescription>{profile.correo || "Sin correo registrado"}</CardDescription>
            </div>
            <Badge variant="secondary" className="mx-auto mt-2 gap-1.5 px-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {profile.rol.nombre}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="rounded-xl border border-border/70 bg-muted/35 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">RUT</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{profile.rut}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Este dato no se puede editar desde el perfil.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Cuenta {profile.estado.toLowerCase()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90 shadow-xs lg:col-span-2">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <UserRound className="h-4 w-4 text-primary" />
              Información personal y de contacto
            </CardTitle>
            <CardDescription>
              {isEditing ? "Modifica los datos necesarios y guarda los cambios." : "Tus datos asociados a la cuenta de acceso."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={saveProfile} className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold text-foreground">Datos personales</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primer nombre" name="primerNombre" value={formValues.primerNombre} disabled={!isEditing || isSaving} error={fieldErrors.primerNombre} onChange={updateField} />
                  <Field label="Segundo nombre" name="segundoNombre" value={formValues.segundoNombre} placeholder="Opcional" disabled={!isEditing || isSaving} error={fieldErrors.segundoNombre} onChange={updateField} />
                  <Field label="Apellido paterno" name="apellidoPaterno" value={formValues.apellidoPaterno} disabled={!isEditing || isSaving} error={fieldErrors.apellidoPaterno} onChange={updateField} />
                  <Field label="Apellido materno" name="apellidoMaterno" value={formValues.apellidoMaterno} placeholder="Opcional" disabled={!isEditing || isSaving} error={fieldErrors.apellidoMaterno} onChange={updateField} />
                </div>
              </section>

              <section className="space-y-4 border-t border-border/60 pt-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold text-foreground">Datos de contacto</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Correo electrónico" name="correo" type="email" value={formValues.correo} disabled={!isEditing || isSaving} error={fieldErrors.correo} onChange={updateField} />
                  <Field label="Teléfono" name="telefono" type="tel" value={formValues.telefono} placeholder="Opcional" disabled={!isEditing || isSaving} error={fieldErrors.telefono} onChange={updateField} />
                </div>
              </section>

              {isEditing && (
                <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={cancelEditing} disabled={isSaving}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Save className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
