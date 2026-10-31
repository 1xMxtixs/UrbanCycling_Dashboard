import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProveedorFormData } from "./types"

interface ProveedorFormFieldsProps {
  form: ProveedorFormData
  updateField: (field: keyof ProveedorFormData, value: string) => void
  disabled?: boolean
  idPrefix?: string
}

export function ProveedorFormFields({
  form,
  updateField,
  disabled = false,
  idPrefix = "prov",
}: ProveedorFormFieldsProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Información del proveedor
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-razonSocial`}>
              Razón social <span className="text-destructive">*</span>
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
            <Label htmlFor={`${idPrefix}-rut`}>
              RUT <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-rut`}
              value={form.rut}
              onChange={(e) => updateField("rut", e.target.value)}
              placeholder="Ej. 76.123.456-7"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-nombreFantasia`}>Nombre fantasía</Label>
            <Input
              id={`${idPrefix}-nombreFantasia`}
              value={form.nombreFantasia}
              onChange={(e) => updateField("nombreFantasia", e.target.value)}
              placeholder="Ej. Bike Parts Chile"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-giro`}>
              Giro <span className="text-destructive">*</span>
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
            <Label htmlFor={`${idPrefix}-condicionesDePago`}>Condiciones de pago</Label>
            <Input
              id={`${idPrefix}-condicionesDePago`}
              value={form.condicionesDePago}
              onChange={(e) => updateField("condicionesDePago", e.target.value)}
              placeholder="Ej. 30 días"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-nombreContacto`}>Nombre de contacto</Label>
            <Input
              id={`${idPrefix}-nombreContacto`}
              value={form.nombreContacto}
              onChange={(e) => updateField("nombreContacto", e.target.value)}
              placeholder="Ej. Juan Pérez"
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Datos de contacto</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-telefono`}>
              Teléfono <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-telefono`}
              value={form.telefono}
              onChange={(e) => updateField("telefono", e.target.value)}
              placeholder="+56 9 1234 5678"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-correo`}>
              Correo electrónico <span className="text-destructive">*</span>
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
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Dirección</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-region`}>
              Región <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-region`}
              value={form.region}
              onChange={(e) => updateField("region", e.target.value)}
              placeholder="Región Metropolitana"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-ciudad`}>
              Ciudad <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-ciudad`}
              value={form.ciudad}
              onChange={(e) => updateField("ciudad", e.target.value)}
              placeholder="Santiago"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-comuna`}>
              Comuna <span className="text-destructive">*</span>
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
            <Label htmlFor={`${idPrefix}-calle`}>
              Calle <span className="text-destructive">*</span>
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
            <Label htmlFor={`${idPrefix}-numero`}>
              Número <span className="text-destructive">*</span>
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
            <Label htmlFor={`${idPrefix}-unidad`}>Unidad / oficina</Label>
            <Input
              id={`${idPrefix}-unidad`}
              value={form.unidad}
              onChange={(e) => updateField("unidad", e.target.value)}
              placeholder="Oficina 402"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-direccionDescripcion`}>Descripción dirección</Label>
            <Input
              id={`${idPrefix}-direccionDescripcion`}
              value={form.direccionDescripcion}
              onChange={(e) => updateField("direccionDescripcion", e.target.value)}
              placeholder="Principal"
              disabled={disabled}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

