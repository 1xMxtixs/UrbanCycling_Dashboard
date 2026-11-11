"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FormDialog, type FormDialogSize } from "@/components/forms/FormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DBCliente } from "../../types";
import { validarYFormatearRut } from "@/lib/client-rut";

const formSchema = z
  .object({
    tipoCliente: z.enum(["natural", "juridica"]),
    nombre: z.string(),
    apellido: z.string(),
    rut: z.string(),
    telefono: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
    razon: z.string(),
    nombreContacto: z.string(),
    giro: z.string(),
  })
  .superRefine((values, context) => {
    const rutResult = validarYFormatearRut(values.rut);
    if (!rutResult.valid) {
      context.addIssue({
        code: "custom",
        path: ["rut"],
        message: rutResult.error,
      });
    }
    if (values.tipoCliente === "natural") {
      if (!values.nombre.trim()) {
        context.addIssue({
          code: "custom",
          path: ["nombre"],
          message: "El nombre es obligatorio",
        });
      }
      if (!values.apellido.trim()) {
        context.addIssue({
          code: "custom",
          path: ["apellido"],
          message: "El apellido es obligatorio",
        });
      }
    }

    if (values.tipoCliente === "juridica" && !values.razon.trim()) {
      context.addIssue({
        code: "custom",
        path: ["razon"],
        message: "La razón social es obligatoria",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface FormCreateClienteProps {
  cliente?: DBCliente;
  onSuccess: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: FormDialogSize;
}

function getInitialValues(cliente?: DBCliente): FormValues {
  if (!cliente) {
    return {
      tipoCliente: "natural",
      nombre: "",
      apellido: "",
      rut: "",
      telefono: "",
      razon: "",
      nombreContacto: "",
      giro: "",
    };
  }

  const isJuridica =
    cliente.tipoCliente === "juridica" || cliente.tipoCliente === "juridico";
  const nombre = [cliente.primerNombre, cliente.segundoNombre]
    .filter(Boolean)
    .join(" ");
  const apellido = [cliente.apellidoPaterno, cliente.apellidoMaterno]
    .filter(Boolean)
    .join(" ");

  return {
    tipoCliente: isJuridica ? "juridica" : "natural",
    nombre,
    apellido,
    rut: cliente.rut || "",
    telefono: cliente.telefonos?.[0]?.telefono || "",
    razon: cliente.razonSocial || "",
    nombreContacto: cliente.nombreContacto || "",
    giro: cliente.giro || "",
  };
}

export function FormCreateCliente({
  cliente,
  onSuccess,
  onCancel,
  open,
  onOpenChange,
  title,
  description,
  size = "lg",
}: FormCreateClienteProps) {
  const [errorGeneral, setErrorGeneral] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: getInitialValues(cliente),
  });

  useEffect(() => {
    if (cliente) {
      form.reset(getInitialValues(cliente));
    }
  }, [cliente, form]);

  const tipoCliente = useWatch({
    control: form.control,
    name: "tipoCliente",
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    setErrorGeneral("");

    try {
      if (cliente) {
        const body: Record<string, unknown> = {
          telefono: values.telefono,
        };

        if (cliente.telefonos?.[0]?.idTelefonoCliente) {
          body.idTelefonoCliente = cliente.telefonos[0].idTelefonoCliente;
        }

        if (values.tipoCliente === "natural") {
          body.nombre = values.nombre;
          body.apellido = values.apellido;
        } else {
          body.razonSocial = values.razon;
          body.giro = values.giro;
          body.nombreContacto = values.nombreContacto;
        }

        const response = await fetch(`/api/clientes/${cliente.idCliente}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Error al actualizar el cliente");
        }

        form.reset();
        onSuccess();
      } else {
        const response = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoCliente: values.tipoCliente,
            nombre: values.nombre,
            apellido: values.apellido,
            razon: values.razon,
            rut: values.rut,
            telefono: values.telefono,
            nombreContacto: values.nombreContacto,
            giro: values.giro,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Error al guardar el cliente");
        }

        toast.success("Cliente creado correctamente");
        form.reset();
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Ocurrió un error inesperado.";
      setErrorGeneral(message);
      toast.error(message);
    }
  };

  const footerContent = (
    <div className="space-y-3">
      {errorGeneral && (
        <p role="alert" className="text-sm text-destructive">
          {errorGeneral}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          )}
          {isSubmitting
            ? "Guardando..."
            : cliente
              ? "Guardar cambios"
              : "Guardar cliente"}
        </Button>
      </div>
    </div>
  );

  const formFields = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tipoCliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                required
                className="inline-block mb-1.5 font-medium text-foreground"
              >
                Tipo de cliente
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={Boolean(cliente)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el tipo de cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper">
                  <SelectItem value="natural">Persona Natural</SelectItem>
                  <SelectItem value="juridica">Persona Jurídica</SelectItem>
                </SelectContent>
              </Select>
              {cliente && (
                <FormDescription>
                  No se puede modificar una vez registrado.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoCliente === "natural" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Nombres
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Andrés" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Apellidos
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pérez Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {tipoCliente === "juridica" && (
          <FormField
            control={form.control}
            name="razon"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Razón social
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Transportes y Ciclismo SpA"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rut"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  RUT
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="12345678-9"
                    {...field}
                    disabled={Boolean(cliente)}
                    onBlur={(event) => {
                      field.onBlur();
                      const result = validarYFormatearRut(
                        event.currentTarget.value
                      );
                      if (result.valid) {
                        form.setValue("rut", result.compact, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </FormControl>
                {cliente && (
                  <FormDescription>
                    No se puede modificar una vez registrado.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Teléfono
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="912345678"
                    maxLength={9}
                    inputMode="numeric"
                    {...field}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value.replace(/\D/g, "").slice(0, 9)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {tipoCliente === "juridica" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombreContacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-block mb-1.5 font-medium text-foreground">
                    Contacto (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Persona de contacto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="giro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-block mb-1.5 font-medium text-foreground">
                    Giro (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Giro comercial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </form>
    </Form>
  );

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title ?? (cliente ? "Editar cliente" : "Registrar Nuevo Cliente")}
        description={
          description ??
          (cliente
            ? "Modifica los datos del cliente."
            : "Ingresa los datos personales o comerciales, teléfonos y direcciones de contacto.")
        }
        size={size}
        footer={footerContent}
      >
        {formFields}
      </FormDialog>
    );
  }

  return (
    <div className="space-y-6">
      {formFields}
      {footerContent}
    </div>
  );
}
