"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Clock3, Loader2, MailPlus, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
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

import { useAssignableRoles } from "../../hooks/useAssignableRoles"

const formSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Ingresa un correo electrónico válido."),
  idRol: z.string().min(1, "Selecciona un rol."),
})

type FormValues = z.infer<typeof formSchema>

type ApiError = {
  code?: string
  message?: string
  fields?: string[]
}

interface FormInviteUsuarioProps {
  onSuccess: (email: string) => void
  onCancel: () => void
}

const defaultValues: FormValues = {
  correo: "",
  idRol: "",
}

/**
 * Comprueba que un nombre informado por el backend pertenezca al formulario
 * antes de asociarle un mensaje de error.
 */
function isFormField(field: string): field is keyof FormValues {
  return Object.prototype.hasOwnProperty.call(defaultValues, field)
}

/**
 * Permite que un administrador seleccione un correo y un rol, y solicita al
 * backend el envío de una invitación firmada.
 */
export function FormInviteUsuario({
  onSuccess,
  onCancel,
}: FormInviteUsuarioProps) {
  const {
    roles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useAssignableRoles()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues,
  })
  const { isSubmitting, isValid } = form.formState
  const generalError = form.formState.errors.root?.message || rolesError

  /**
   * Envía solamente el correo y el rol. Los datos personales y la contraseña
   * serán solicitados posteriormente a la persona invitada.
   */
  async function onSubmit(values: FormValues) {
    form.clearErrors()

    try {
      const response = await fetch("/api/users/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: values.correo.trim().toLowerCase(),
          idRol: Number(values.idRol),
        }),
      })
      const result = (await response
        .json()
        .catch(() => null)) as ApiError | null

      if (!response.ok) {
        const message =
          result?.message ?? "No fue posible enviar la invitación."

        for (const field of result?.fields ?? []) {
          if (isFormField(field)) {
            form.setError(field, {
              type: "server",
              message,
            })
          }
        }

        form.setError("root", {
          type: "server",
          message,
        })
        return
      }

      const normalizedEmail = values.correo.trim().toLowerCase()

      form.reset(defaultValues)
      onSuccess(normalizedEmail)
    } catch (error) {
      form.setError("root", {
        type: "server",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible enviar la invitación.",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {generalError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {generalError}
          </div>
        )}

        <section className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MailPlus className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Destinatario de la invitación
              </h3>
              <p className="text-xs text-muted-foreground">
                Define quién podrá completar el registro.
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
                    autoFocus
                    type="email"
                    placeholder="nombre@urbancycling.cl"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  El correo quedará asociado a la invitación y no podrá
                  modificarse durante el registro.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Acceso al sistema</h3>
              <p className="text-xs text-muted-foreground">
                Asigna los permisos iniciales de la futura cuenta.
              </p>
            </div>
          </div>

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
                  El rol quedará fijado por la invitación.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            El enlace tendrá una vigencia de 48 horas. El usuario aparecerá en
            el listado cuando complete correctamente su registro.
          </p>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isSubmitting}
            onClick={onCancel}
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
                Enviando...
              </>
            ) : (
              <>
                <MailPlus className="size-4" aria-hidden="true" />
                Enviar invitación
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
