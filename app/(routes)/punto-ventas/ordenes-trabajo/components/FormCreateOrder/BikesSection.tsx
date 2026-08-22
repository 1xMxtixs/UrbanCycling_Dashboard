import React from "react"
import { Plus, Trash2, ChevronDown, ChevronUp, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ImageUpload"

export interface BikeInput {
  marca: string
  modelo: string
  color: string
  descripcion: string
  imagenUrl: string
  imageFile?: File | null
  imagePreview?: string | null
  isUploading: boolean
  isCollapsed: boolean
}

interface BikesSectionProps {
  bikes: BikeInput[]
  isSubmitting: boolean
  onAddBike: () => void
  onRemoveBike: (index: number) => void
  onUpdateBikeField: (index: number, field: keyof BikeInput, value: any) => void
  onToggleCollapse: (index: number) => void
  onBikeImageChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveBikeImage: (index: number) => void
}

export function BikesSection({
  bikes,
  isSubmitting,
  onAddBike,
  onRemoveBike,
  onUpdateBikeField,
  onToggleCollapse,
  onBikeImageChange,
  onRemoveBikeImage,
}: BikesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Wrench className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-foreground font-bold">
            Bicicletas Asociadas
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {bikes.length}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddBike}
          className="flex items-center gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir otra
        </Button>
      </div>

      <div className="space-y-3">
        {bikes.map((bike, idx) => {
          const isCollapsed = bike.isCollapsed
          const title =
            bike.marca || bike.modelo
              ? `${bike.marca} ${bike.modelo}`.trim()
              : `Bicicleta #${idx + 1}`

          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-all"
            >
              <div
                onClick={() => onToggleCollapse(idx)}
                className="flex cursor-pointer items-center justify-between bg-muted/40 p-3 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {title}
                  </span>
                  {bike.color && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border">
                      {bike.color}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {bikes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveBike(idx)
                      }}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Marca <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Ej: Trek, Giant"
                        value={bike.marca}
                        onChange={(e) =>
                          onUpdateBikeField(idx, "marca", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Modelo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Ej: Marlin 7"
                        value={bike.modelo}
                        onChange={(e) =>
                          onUpdateBikeField(idx, "modelo", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Color <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Ej: Negro/Rojo"
                        value={bike.color}
                        onChange={(e) =>
                          onUpdateBikeField(idx, "color", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Observaciones / Estado de Ingreso
                    </Label>
                    <Textarea
                      placeholder="Rayaduras previas, componentes adicionales..."
                      value={bike.descripcion}
                      onChange={(e) =>
                        onUpdateBikeField(idx, "descripcion", e.target.value)
                      }
                      rows={2}
                    />
                  </div>

                  {/* Subida de Imagen por Bicicleta usando componente global */}
                  <ImageUpload
                    label="Foto de la Bicicleta (Opcional)"
                    imagePreview={bike.imagePreview || bike.imagenUrl || null}
                    onChange={(file, previewUrl) => {
                      onUpdateBikeField(idx, "imageFile", file)
                      onUpdateBikeField(idx, "imagePreview", previewUrl)
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
