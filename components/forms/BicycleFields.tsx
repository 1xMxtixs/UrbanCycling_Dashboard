"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type BicycleFieldsValue = {
  marca: string
  modelo: string
  color: string
  descripcion: string
}

type BicycleFieldsProps = {
  idPrefix: string
  value: BicycleFieldsValue
  disabled?: boolean
  onChange: (field: keyof BicycleFieldsValue, value: string) => void
}

/**
 * Campos controlados que comparten la creacion de una ODT y la edicion de sus
 * bicicletas. Las imagenes se administran fuera porque tienen ciclo propio.
 */
export function BicycleFields({
  idPrefix,
  value,
  disabled = false,
  onChange,
}: BicycleFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label
            required
            htmlFor={`${idPrefix}-marca`}
            className="mb-1.5 inline-block font-medium text-foreground"
          >
            Marca
          </Label>
          <Input
            id={`${idPrefix}-marca`}
            placeholder="Ej: Trek, Giant"
            maxLength={50}
            value={value.marca}
            disabled={disabled}
            onChange={(event) => onChange("marca", event.target.value)}
          />
        </div>

        <div>
          <Label
            required
            htmlFor={`${idPrefix}-modelo`}
            className="mb-1.5 inline-block font-medium text-foreground"
          >
            Modelo
          </Label>
          <Input
            id={`${idPrefix}-modelo`}
            placeholder="Ej: Marlin 7"
            maxLength={50}
            value={value.modelo}
            disabled={disabled}
            onChange={(event) => onChange("modelo", event.target.value)}
          />
        </div>

        <div>
          <Label
            required
            htmlFor={`${idPrefix}-color`}
            className="mb-1.5 inline-block font-medium text-foreground"
          >
            Color
          </Label>
          <Input
            id={`${idPrefix}-color`}
            placeholder="Ej: Negro/Rojo"
            maxLength={50}
            value={value.color}
            disabled={disabled}
            onChange={(event) => onChange("color", event.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-descripcion`}
            className="inline-block font-medium text-foreground"
          >
            Observaciones / Estado de ingreso{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {value.descripcion.length}/500
          </span>
        </div>
        <Textarea
          id={`${idPrefix}-descripcion`}
          placeholder="Rayaduras previas, componentes adicionales, golpes, abolladuras..."
          value={value.descripcion}
          maxLength={500}
          disabled={disabled}
          rows={2}
          onChange={(event) => onChange("descripcion", event.target.value)}
        />
      </div>
    </div>
  )
}
