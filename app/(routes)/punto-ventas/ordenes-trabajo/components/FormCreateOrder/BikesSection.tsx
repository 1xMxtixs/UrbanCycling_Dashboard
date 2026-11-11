"use client"

import React from "react"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/forms/ImageUpload"
import { MAX_BICYCLE_IMAGES } from "@/lib/bicycle-images"

export interface BikeInput {
  marca: string
  modelo: string
  color: string
  descripcion: string

  // Compatibilidad con el API actual
  imagenUrl: string

  // Nuevas imágenes múltiples
  imageFiles: File[]
  imagePreviews: string[]

  isUploading: boolean
  isCollapsed: boolean
}

interface BikesSectionProps {
  bikes: BikeInput[]
  isSubmitting: boolean
  onAddBike: () => void
  onRemoveBike: (index: number) => void
  onUpdateBikeField: (
    index: number,
    field: keyof BikeInput,
    value: BikeInput[keyof BikeInput]
  ) => void
  onToggleCollapse: (index: number) => void
  onAddBikeImage: (index: number, file: File, preview: string) => void
  onRemoveBikeImage: (
    bikeIndex: number,
    imageIndex: number
  ) => void
}

export function BikesSection({
  bikes,
  isSubmitting,
  onAddBike,
  onRemoveBike,
  onUpdateBikeField,
  onToggleCollapse,
  onAddBikeImage,
  onRemoveBikeImage,
}: BikesSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Wrench className="h-4.5 w-4.5 text-muted-foreground" />

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
          disabled={isSubmitting}
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
              className="overflow-hidden rounded-xl border border-border transition-colors"
            >
              {/* Encabezado */}
              <div
                onClick={() => onToggleCollapse(idx)}
                className="flex cursor-pointer items-center justify-between bg-muted/40 p-3 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>

                  <span className="text-sm font-semibold text-foreground">
                    {title}
                  </span>

                  {bike.color && (
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {bike.color}
                    </span>
                  )}

                  {bike.imagePreviews.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {bike.imagePreviews.length}{" "}
                      {bike.imagePreviews.length === 1
                        ? "foto"
                        : "fotos"}
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
                      disabled={isSubmitting}
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
                  {/* Información de bicicleta */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label required className="inline-block mb-1.5 font-medium text-foreground">
                        Marca
                      </Label>

                      <Input
                        id={`bike-${idx}-marca`}
                        placeholder="Ej: Trek, Giant"
                        value={bike.marca}
                        onChange={(e) =>
                          onUpdateBikeField(
                            idx,
                            "marca",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label required className="inline-block mb-1.5 font-medium text-foreground">
                        Modelo
                      </Label>

                      <Input
                        id={`bike-${idx}-modelo`}
                        placeholder="Ej: Marlin 7"
                        value={bike.modelo}
                        onChange={(e) =>
                          onUpdateBikeField(
                            idx,
                            "modelo",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label required className="inline-block mb-1.5 font-medium text-foreground">
                        Color
                      </Label>

                      <Input
                        id={`bike-${idx}-color`}
                        placeholder="Ej: Negro/Rojo"
                        value={bike.color}
                        onChange={(e) =>
                          onUpdateBikeField(
                            idx,
                            "color",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="inline-block font-medium text-foreground">
                        Observaciones / Estado de Ingreso{" "}
                        <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {(bike.descripcion || "").length}/500
                      </span>
                    </div>

                    <Textarea
                      placeholder="Rayaduras previas, componentes adicionales, golpes, abolladuras..."
                      value={bike.descripcion}
                      maxLength={500}
                      onChange={(e) =>
                        onUpdateBikeField(
                          idx,
                          "descripcion",
                          e.target.value
                        )
                      }
                      rows={2}
                    />
                  </div>

                  {/* Fotografías */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="inline-block mb-1.5 font-medium text-foreground">
                        Fotografías del Estado de Ingreso
                      </Label>
                      {bike.imagePreviews.length > 0 &&
                        bike.imagePreviews.length < MAX_BICYCLE_IMAGES && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById(`bike-add-image-${idx}`)
                                ?.click()
                            }
                            disabled={isSubmitting}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Añadir foto
                          </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      Puedes agregar hasta {MAX_BICYCLE_IMAGES} fotografías por bicicleta.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {bike.imagePreviews.map((preview, imageIndex) => (
                        <div key={`${preview}-${imageIndex}`} className="flex justify-center">
                          <ImageUpload
                            label=""
                            imagePreview={preview}
                            disabled={isSubmitting}
                            onChange={(_, nextPreview) => {
                              if (!nextPreview) onRemoveBikeImage(idx, imageIndex)
                            }}
                          />
                        </div>
                      ))}
                      {bike.imagePreviews.length < MAX_BICYCLE_IMAGES && (
                        <div className={bike.imagePreviews.length > 0 ? "hidden" : "col-span-2 w-full sm:col-span-3 md:col-span-4"}>
                          <ImageUpload
                            label=""
                            inputId={`bike-add-image-${idx}`}
                            imagePreview={null}
                            disabled={isSubmitting}
                            onChange={(file, preview) => {
                              if (file && preview) onAddBikeImage(idx, file, preview)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
