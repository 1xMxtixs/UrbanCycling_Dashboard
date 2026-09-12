"use client"

import React from "react"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wrench,
  ImagePlus,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export interface BikeImage {
  file: File
  preview: string
}

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
    value: any
  ) => void
  onToggleCollapse: (index: number) => void
  onBikeImagesChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void
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
  onBikeImagesChange,
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
              className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-all"
            >
              {/* Encabezado */}
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
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {bike.color}
                    </span>
                  )}

                  {bike.imagePreviews.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
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
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Marca{" "}
                        <span className="text-destructive">*</span>
                      </Label>

                      <Input
                        placeholder="Ej: Trek, Giant"
                        value={bike.marca}
                        onChange={(e) =>
                          onUpdateBikeField(
                            idx,
                            "marca",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Modelo{" "}
                        <span className="text-destructive">*</span>
                      </Label>

                      <Input
                        placeholder="Ej: Marlin 7"
                        value={bike.modelo}
                        onChange={(e) =>
                          onUpdateBikeField(
                            idx,
                            "modelo",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Color{" "}
                        <span className="text-destructive">*</span>
                      </Label>

                      <Input
                        placeholder="Ej: Negro/Rojo"
                        value={bike.color}
                        onChange={(e) =>
                          onUpdateBikeField(
                            idx,
                            "color",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Observaciones / Estado de Ingreso
                    </Label>

                    <Textarea
                      placeholder="Rayaduras previas, componentes adicionales, golpes, abolladuras..."
                      value={bike.descripcion}
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Fotografías del Estado de Ingreso
                      </Label>

                      {bike.imagePreviews.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {bike.imagePreviews.length}{" "}
                          {bike.imagePreviews.length === 1
                            ? "imagen seleccionada"
                            : "imágenes seleccionadas"}
                        </span>
                      )}
                    </div>

                    <label
                      htmlFor={`bike-images-${idx}`}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40 ${
                        isSubmitting
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />

                      <span className="text-sm font-semibold text-foreground">
                        Agregar fotografías
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        Puedes seleccionar varias imágenes a la vez
                      </span>

                      <span className="mt-1 text-[10px] text-muted-foreground">
                        JPG, PNG, WEBP o GIF · Máximo 5 MB por imagen
                      </span>

                      <input
                        id={`bike-images-${idx}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        disabled={isSubmitting}
                        onChange={(e) =>
                          onBikeImagesChange(idx, e)
                        }
                      />
                    </label>

                    {/* Galería de previews */}
                    {bike.imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 md:grid-cols-4">
                        {bike.imagePreviews.map(
                          (preview, imageIndex) => (
                            <div
                              key={`${preview}-${imageIndex}`}
                              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              <img
                                src={preview}
                                alt={`Foto ${
                                  imageIndex + 1
                                } de bicicleta #${idx + 1}`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />

                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                                <span className="text-[10px] font-medium text-white">
                                  Foto {imageIndex + 1}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveBikeImage(
                                    idx,
                                    imageIndex
                                  )
                                }
                                disabled={isSubmitting}
                                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-colors hover:bg-destructive"
                                aria-label={`Eliminar foto ${
                                  imageIndex + 1
                                }`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}