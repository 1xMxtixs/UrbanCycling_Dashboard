import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormSection } from "@/components/forms/FormLayout"
import { validarYFormatearRut } from "@/lib/client-rut"
import { REGIONES_CHILE, getRegionChile } from "@/lib/chile-data"
import type { ProveedorFormData } from "./types"

interface ProveedorFormFieldsProps {
  form: ProveedorFormData
  updateField: (field: keyof ProveedorFormData, value: string) => void
  disabled?: boolean
  idPrefix?: string
}

export function focusProveedorField(
  idPrefix: string,
  field: keyof ProveedorFormData
) {
  const element = document.getElementById(`${idPrefix}-${field}`)
  if (!element) return

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  element.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "nearest",
  })
  requestAnimationFrame(() => element.focus())
}

export function ProveedorFormFields({
  form,
  updateField,
  disabled = false,
  idPrefix = "prov",
}: ProveedorFormFieldsProps) {
  const regionSeleccionada = getRegionChile(form.region)
  const ciudadesDisponibles = regionSeleccionada?.ciudades ?? []

  const handleRegionChange = (nombreRegion: string) => {
    updateField("region", nombreRegion)
    const nuevaRegion = getRegionChile(nombreRegion)
    if (!nuevaRegion?.ciudades.includes(form.ciudad)) {
      updateField("ciudad", "")
    }
  }

  return (
    <div className="space-y-6">
      <FormSection title="Información del proveedor">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor={`${idPrefix}-razonSocial`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Razón social
            </Label>
            <Input
              id={`${idPrefix}-razonSocial`}
              value={form.razonSocial}
              onChange={(e) => updateField("razonSocial", e.target.value)}
              placeholder="Ej. Distribuidora de Bicicletas Ltda."
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-rut`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              RUT
            </Label>
            <Input
              id={`${idPrefix}-rut`}
              value={form.rut}
              onChange={(e) => updateField("rut", e.target.value)}
              onBlur={(e) => {
                const result = validarYFormatearRut(e.target.value)
                if (result.valid) updateField("rut", result.formatted)
              }}
              placeholder="Ej. 76.123.456-7"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-nombreFantasia`}
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Nombre fantasía
            </Label>
            <Input
              id={`${idPrefix}-nombreFantasia`}
              value={form.nombreFantasia}
              onChange={(e) => updateField("nombreFantasia", e.target.value)}
              placeholder="Ej. Bike Parts Chile"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-giro`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Giro
            </Label>
            <Input
              id={`${idPrefix}-giro`}
              value={form.giro}
              onChange={(e) => updateField("giro", e.target.value)}
              placeholder="Ej. Venta de repuestos"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-condicionesDePago`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Condiciones de pago
            </Label>
            <Input
              id={`${idPrefix}-condicionesDePago`}
              value={form.condicionesDePago}
              onChange={(e) => updateField("condicionesDePago", e.target.value)}
              placeholder="Ej. 30 días"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor={`${idPrefix}-nombreContacto`}
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Nombre de contacto
            </Label>
            <Input
              id={`${idPrefix}-nombreContacto`}
              value={form.nombreContacto}
              onChange={(e) => updateField("nombreContacto", e.target.value)}
              placeholder="Ej. Juan Pérez"
              disabled={disabled}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Datos de contacto">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-telefono`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Teléfono
            </Label>
            <Input
              id={`${idPrefix}-telefono`}
              value={form.telefono}
              inputMode="tel"
              onChange={(e) =>
                updateField(
                  "telefono",
                  e.target.value
                    .replace(/[^\d+]/g, "")
                    .replace(/(?!^)\+/g, "")
                    .slice(0, 20)
                )
              }
              placeholder="+56 9 1234 5678"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-correo`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Correo electrónico
            </Label>
            <Input
              id={`${idPrefix}-correo`}
              type="email"
              value={form.correo}
              onChange={(e) => updateField("correo", e.target.value)}
              placeholder="contacto@proveedor.cl"
              disabled={disabled}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Dirección">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-region`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Región
            </Label>
            <Select
              value={regionSeleccionada?.nombre ?? form.region}
              onValueChange={handleRegionChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={`${idPrefix}-region`}
                aria-label="Seleccionar región"
                className="w-full"
              >
                <SelectValue placeholder="Selecciona una región" />
              </SelectTrigger>
              <SelectContent position="popper">
                {REGIONES_CHILE.map((region) => (
                  <SelectItem key={region.nombre} value={region.nombre}>
                    {region.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-ciudad`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Ciudad
            </Label>
            <Select
              value={form.ciudad}
              onValueChange={(value) => updateField("ciudad", value)}
              disabled={disabled || !regionSeleccionada}
            >
              <SelectTrigger
                id={`${idPrefix}-ciudad`}
                aria-label="Seleccionar ciudad"
                className="w-full"
              >
                <SelectValue
                  placeholder={
                    !regionSeleccionada
                      ? "Primero selecciona una región"
                      : "Selecciona una ciudad"
                  }
                />
              </SelectTrigger>
              <SelectContent position="popper">
                {ciudadesDisponibles.map((ciudad) => (
                  <SelectItem key={ciudad} value={ciudad}>
                    {ciudad}
                  </SelectItem>
                ))}
                {form.ciudad && !ciudadesDisponibles.includes(form.ciudad) && (
                  <SelectItem value={form.ciudad}>{form.ciudad}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-comuna`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Comuna
            </Label>
            <Input
              id={`${idPrefix}-comuna`}
              value={form.comuna}
              onChange={(e) => updateField("comuna", e.target.value)}
              placeholder="Providencia"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-calle`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Calle
            </Label>
            <Input
              id={`${idPrefix}-calle`}
              value={form.calle}
              onChange={(e) => updateField("calle", e.target.value)}
              placeholder="Av. Providencia"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-numero`}
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Número
            </Label>
            <Input
              id={`${idPrefix}-numero`}
              value={form.numero}
              onChange={(e) => updateField("numero", e.target.value)}
              placeholder="1234"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`${idPrefix}-unidad`}
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Unidad / oficina
            </Label>
            <Input
              id={`${idPrefix}-unidad`}
              value={form.unidad}
              onChange={(e) => updateField("unidad", e.target.value)}
              placeholder="Oficina 402"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor={`${idPrefix}-direccionDescripcion`}
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Nombre de la dirección
            </Label>
            <Input
              id={`${idPrefix}-direccionDescripcion`}
              value={form.direccionDescripcion}
              onChange={(e) =>
                updateField("direccionDescripcion", e.target.value)
              }
              placeholder="Principal"
              disabled={disabled}
            />
          </div>
        </div>
      </FormSection>
    </div>
  )
}
