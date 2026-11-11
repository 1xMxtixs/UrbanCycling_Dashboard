"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Loader2, ShieldCheck, UserRound } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatRutInput } from "@/lib/format-rut-input"

import { useAssignableRoles } from "../../hooks/useAssignableRoles"
import type { User } from "../../types"

const formSchema = z
  .object({
    primerNombre: z
      .string()
      .trim()
      .min(1, "El primer nombre es obligatorio.")
      .max(50, "El primer nombre no puede superar los 50 caracteres."),
    segundoNombre: z
      .string()
      .trim()
      .max(50, "El segundo nombre no puede superar los 50 caracteres."),
    apellidoPaterno: z
      .string()
      .trim()
      .min(1, "El apellido paterno es obligatorio.")
      .max(50, "El apellido paterno no puede superar los 50 caracteres."),
    apellidoMaterno: z
      .string()
      .trim()
      .max(50, "El apellido materno no puede superar los 50 caracteres."),
    rut: z.string().trim().min(1, "El RUT es obligatorio."),
    correo: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Ingresa un correo electrónico válido."),
    telefono: z
      .string()
      .trim()
      .max(20, "El teléfono no puede superar los 20 caracteres."),
    idRol: z.string().min(1, "Selecciona un rol."),
    contrasena: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(128, "La contraseña no puede superar los 128 caracteres."),
    confirmacionContrasena: z.string(),
  })
  .refine((values) => values.contrasena === values.confirmacionContrasena, {
    path: ["confirmacionContrasena"],
    message: "Las contraseñas no coinciden.",
  })

type FormValues = z.infer<typeof formSchema>

type ApiError = {
  code?: string
  message?: string
  fields?: string[]
}

type CreateUserResponse = {
  data: User
}

interface FormCreateUsuarioProps {
  onSuccess: (user: User) => void
  onCancel: () => void
}

const defaultValues: FormValues = {
  primerNombre: "",
  segundoNombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  rut: "",
  correo: "",
  telefono: "",
  idRol: "",
  contrasena: "",
  confirmacionContrasena: "",
}

/**
 * Comprueba si el nombre de campo informado por la API pertenece al formulario
 * antes de asignarle un error del servidor.
 */
function isFormField(field: string): field is keyof FormValues {
  return Object.prototype.hasOwnProperty.call(defaultValues, field)
}

/**
 * Registra una cuenta mediante el endpoint administrativo. Mantiene las
 * validaciones inmediatas en el cliente y muestra los errores definitivos que
 * entrega el backend junto a los campos correspondientes.
 */
export function FormCreateUsuario({
  onSuccess,
  onCancel,
}: FormCreateUsuarioProps) {
  const {
    roles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useAssignableRoles()
  const [generalError, setGeneralError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues,
  })

  const { isSubmitting, isValid } = form.formState
  const displayedError = generalError || rolesError

  /**
   * Envía el formulario y distribuye los errores de la API entre el resumen
   * general y los campos afectados. Las contraseñas se limpian al completarse
   * correctamente la creación.
   */
  async function onSubmit(values: FormValues) {
    setGeneralError("")
    form.clearErrors()

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primerNombre: values.primerNombre,
          segundoNombre: values.segundoNombre || null,
          apellidoPaterno: values.apellidoPaterno,
          apellidoMaterno: values.apellidoMaterno || null,
          rut: values.rut,
          correo: values.correo,
          telefono: values.telefono || null,
          idRol: Number(values.idRol),
          contrasena: values.contrasena,
          confirmacionContrasena: values.confirmacionContrasena,
        }),
      })

      const result = (await response.json().catch(() => null)) as
        CreateUserResponse | ApiError | null

      if (!response.ok) {
        const apiError = result as ApiError | null
        const message =
          apiError?.message ?? "No fue posible registrar el usuario."

        for (const field of apiError?.fields ?? []) {
          if (isFormField(field)) {
            form.setError(field, {
              type: "server",
              message,
            })
          }
        }

        setGeneralError(message)
        return
      }

      const createdUser = (result as CreateUserResponse | null)?.data

      if (!createdUser) {
        throw new Error(
          "La respuesta del servidor no contiene el usuario creado."
        )
      }

      form.reset(defaultValues)
      setShowPassword(false)
      setShowConfirmation(false)
      onSuccess(createdUser)
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el usuario."
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {displayedError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {displayedError}
          </div>
        )}

        <section className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Información personal</h3>
              <p className="text-xs text-muted-foreground">
                Datos de identificación del nuevo usuario.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primerNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primer nombre *</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Ej. Camila"
                      autoComplete="given-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="segundoNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segundo nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Andrea"
                      autoComplete="additional-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apellidoPaterno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido paterno *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Soto"
                      autoComplete="family-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apellidoMaterno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido materno</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Rojas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12.345.678-5"
                      inputMode="text"
                      value={field.value}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      onChange={(event) =>
                        field.onChange(formatRutInput(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      autoComplete="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Acceso al sistema</h3>
              <p className="text-xs text-muted-foreground">
                Correo, rol y contraseña inicial.
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="nombre@urbancycling.cl"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idRol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol inicial *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingRoles}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingRoles
                            ? "Cargando roles..."
                            : "Selecciona un rol"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    {roles.map((role) => (
                      <SelectItem key={role.idRol} value={String(role.idRol)}>
                        {role.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  El rol define las acciones disponibles para la cuenta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contrasena"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña inicial *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>Mínimo 8 caracteres.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmacionContrasena"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirmation
                            ? "Ocultar confirmación"
                            : "Mostrar confirmación"
                        }
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setShowConfirmation((value) => !value)}
                      >
                        {showConfirmation ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-xl font-semibold"
            disabled={
              !isValid || isSubmitting || isLoadingRoles || Boolean(rolesError)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Registrando...
              </>
            ) : (
              <>
                <UserRound className="size-4" aria-hidden="true" />
                Registrar usuario
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
