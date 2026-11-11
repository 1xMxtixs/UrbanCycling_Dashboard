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
    const rutResult = values.rut.trim()
      ? validarYFormatearRut(values.rut)
      : null;
    if (rutResult && !rutResult.valid) {
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
  const [validationError, setValidationError] = useState("");

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

  const resetForm = () => {
    form.reset(getInitialValues(cliente));
    setErrorGeneral("");
    setValidationError("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange?.(nextOpen);
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const handleInvalid = () => {
    const values = form.getValues();
    const requiredFields: Array<{
      name: keyof FormValues;
      missing: boolean;
      message: string;
    }> = values.tipoCliente === "natural"
      ? [
          { name: "nombre" as const, missing: !values.nombre.trim(), message: "El nombre es obligatorio." },
          { name: "apellido" as const, missing: !values.apellido.trim(), message: "El apellido es obligatorio." },
        ]
      : [
          { name: "razon" as const, missing: !values.razon.trim(), message: "La razón social es obligatoria." },
        ];

    const rutValidation = values.rut.trim()
      ? validarYFormatearRut(values.rut)
      : null;
    if (rutValidation && !rutValidation.valid) {
      requiredFields.push({
        name: "rut" as const,
        missing: true,
        message: rutValidation.error,
      });
    }
    requiredFields.push({
      name: "telefono" as const,
      missing: values.telefono.trim().length < 8,
      message: values.telefono.trim()
        ? "El teléfono debe tener al menos 8 dígitos."
        : "El teléfono es obligatorio.",
    });

    const firstMissingField = requiredFields.find((field) => field.missing);
    if (firstMissingField) {
      setValidationError(firstMissingField.message);
      form.setFocus(firstMissingField.name);
      return;
    }

    setValidationError("Revisa los datos ingresados.");
  };

  const handleFormSubmit = form.handleSubmit((values) => {
    setValidationError("");
    return onSubmit(values);
  }, handleInvalid);

  const onSubmit = async (values: FormValues) => {
    setErrorGeneral("");
    setValidationError("");

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

        resetForm();
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
        resetForm();
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
      {validationError && (
        <p role="alert" className="text-sm text-destructive">
          {validationError}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="button"
          onClick={handleFormSubmit}
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
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="tipoCliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                required
                data-error={false}
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
                  <SelectTrigger ref={field.ref} className="w-full" aria-invalid={false}>
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
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Nombres
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input placeholder="Ej: Juan Andrés" {...field} />
                  </FormControl>
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
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Apellidos
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input placeholder="Ej: Pérez Silva" {...field} />
                  </FormControl>
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
                  data-error={false}
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Razón social
                </FormLabel>
                <FormControl aria-invalid={false}>
                  <Input
                    placeholder="Ej: Transportes y Ciclismo SpA"
                    {...field}
                  />
                </FormControl>
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
                  data-error={false}
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  RUT (opcional)
                </FormLabel>
                <FormControl aria-invalid={false}>
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
                  data-error={false}
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Teléfono
                </FormLabel>
                <FormControl aria-invalid={false}>
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
                  <FormControl aria-invalid={false}>
                    <Input placeholder="Persona de contacto" {...field} />
                  </FormControl>
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
                  <FormControl aria-invalid={false}>
                    <Input placeholder="Giro comercial" {...field} />
                  </FormControl>
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
        onOpenChange={handleOpenChange}
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
