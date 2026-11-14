"use client"

import { useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import {
  BicycleFields,
  type BicycleFieldsValue,
} from "@/components/forms/BicycleFields"
import { ImageUpload } from "@/components/forms/ImageUpload"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MAX_BICYCLE_IMAGES } from "@/lib/bicycle-images"
import {
  crearBicicletaOrden,
  descartarSubidas,
  eliminarBicicletaOrden,
  guardarEdicionBicicleta,
  type SubidaTemporal,
} from "@/app/(routes)/bicicletas/lib/bicycle-editor"
import type { Bicicleta } from "@/app/(routes)/bicicletas/types"
import type { WorkOrderBike } from "../../types"

type EditorMode =
  { kind: "create" } | { kind: "edit"; bicycleId: number } | null

type WorkOrderBicyclesSectionProps = {
  idOrdenDeTrabajo: number
  bicycles: WorkOrderBike[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onChange: (bicycles: WorkOrderBike[]) => void
  onPersisted: () => void
  onPreviewImages: (images: string[], index: number, title: string) => void
}

const EMPTY_BICYCLE: BicycleFieldsValue = {
  marca: "",
  modelo: "",
  color: "",
  descripcion: "",
}

/** Convierte la respuesta de la API al formato utilizado por la ODT. */
function toWorkOrderBike(bicycle: Bicicleta): WorkOrderBike {
  const imagenes = bicycle.imagenes?.map((image) => image.urlImagen) ?? []

  return {
    idBicicleta: bicycle.idBicicleta,
    marca: bicycle.marca,
    modelo: bicycle.modelo,
    color: bicycle.color,
    descripcion: bicycle.descripcion,
    imagenUrl: bicycle.imagenUrl ?? imagenes[0] ?? null,
    imagenes,
  }
}

/**
 * Administra altas, ediciones y borrados de bicicletas sin cerrar el detalle
 * de la ODT. Solo el borrado utiliza un dialogo de confirmacion adicional.
 */
export function WorkOrderBicyclesSection({
  idOrdenDeTrabajo,
  bicycles,
  canCreate,
  canUpdate,
  canDelete,
  onChange,
  onPersisted,
  onPreviewImages,
}: WorkOrderBicyclesSectionProps) {
  const [openBikes, setOpenBikes] = useState<Record<number, boolean>>({})
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [draft, setDraft] = useState<BicycleFieldsValue>(EMPTY_BICYCLE)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WorkOrderBike | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploads] = useState(() => new Map<File, SubidaTemporal>())
  const previewsRef = useRef<string[]>([])

  useEffect(() => {
    previewsRef.current = newPreviews
  }, [newPreviews])

  useEffect(
    () => () => {
      void descartarSubidas([...uploads.values()])
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview))
    },
    [uploads]
  )

  /** Limpia archivos locales y temporales al cerrar el editor. */
  function resetEditor(discardUploads = true) {
    newPreviews.forEach((preview) => URL.revokeObjectURL(preview))
    if (discardUploads) void descartarSubidas([...uploads.values()])
    uploads.clear()
    setDraft(EMPTY_BICYCLE)
    setExistingImages([])
    setNewFiles([])
    setNewPreviews([])
    setEditorMode(null)
  }

  /** Abre un formulario vacio para asociar una bicicleta a la ODT. */
  function startCreating() {
    resetEditor()
    setEditorMode({ kind: "create" })
  }

  /** Carga los datos actuales de una bicicleta en el editor inline. */
  function startEditing(bicycle: WorkOrderBike) {
    resetEditor()
    setDraft({
      marca: bicycle.marca,
      modelo: bicycle.modelo,
      color: bicycle.color,
      descripcion: bicycle.descripcion ?? "",
    })
    setExistingImages(bicycle.imagenes ?? [])
    setOpenBikes((current) => ({
      ...current,
      [bicycle.idBicicleta]: true,
    }))
    setEditorMode({ kind: "edit", bicycleId: bicycle.idBicicleta })
  }

  /** Agrega una imagen local sin superar el limite definido por el backend. */
  function addImage(file: File | null, preview: string | null) {
    if (!file || !preview || isSaving) return
    if (existingImages.length + newFiles.length + 1 > MAX_BICYCLE_IMAGES) {
      URL.revokeObjectURL(preview)
      toast.error(
        `Solo puedes asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta.`
      )
      return
    }
    setNewFiles((current) => [...current, file])
    setNewPreviews((current) => [...current, preview])
  }

  /** Retira una imagen nueva y descarta su temporal si ya fue subida. */
  function removeNewImage(index: number) {
    const file = newFiles[index]
    const temporal = uploads.get(file)
    if (temporal) void descartarSubidas([temporal])
    uploads.delete(file)
    URL.revokeObjectURL(newPreviews[index])
    setNewFiles((current) => current.filter((_, item) => item !== index))
    setNewPreviews((current) => current.filter((_, item) => item !== index))
  }

  /** Valida los campos obligatorios antes de llamar al backend. */
  function hasValidDraft() {
    if (!draft.marca.trim() || !draft.modelo.trim() || !draft.color.trim()) {
      toast.error("Marca, modelo y color son obligatorios.")
      return false
    }
    return true
  }

  /** Registra una bicicleta y actualiza inmediatamente la lista visible. */
  async function handleCreate() {
    if (!hasValidDraft()) return
    setIsSaving(true)
    try {
      const created = await crearBicicletaOrden({
        idOrdenDeTrabajo,
        valores: draft,
        archivos: newFiles,
        subidas: uploads,
      })
      onChange([...bicycles, toWorkOrderBike(created)])
      resetEditor(false)
      onPersisted()
      toast.success("Bicicleta agregada correctamente.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo agregar la bicicleta."
      )
    } finally {
      setIsSaving(false)
    }
  }

  /** Guarda la edicion y conserva las imagenes existentes seleccionadas. */
  async function handleUpdate(bicycle: WorkOrderBike) {
    if (!hasValidDraft()) return
    setIsSaving(true)
    try {
      const updated = await guardarEdicionBicicleta({
        id: bicycle.idBicicleta,
        valores: { idOrdenDeTrabajo, ...draft },
        imagenes: existingImages,
        archivos: newFiles,
        subidas: uploads,
      })
      onChange(
        bicycles.map((current) =>
          current.idBicicleta === bicycle.idBicicleta
            ? toWorkOrderBike(updated)
            : current
        )
      )
      resetEditor(false)
      onPersisted()
      toast.success("Bicicleta actualizada correctamente.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la bicicleta."
      )
    } finally {
      setIsSaving(false)
    }
  }

  /** Ejecuta el borrado fisico despues de la confirmacion explicita. */
  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await eliminarBicicletaOrden(deleteTarget.idBicicleta)
      onChange(
        bicycles.filter(
          (bicycle) => bicycle.idBicicleta !== deleteTarget.idBicicleta
        )
      )
      setDeleteTarget(null)
      onPersisted()
      toast.success("Bicicleta eliminada correctamente.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la bicicleta."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  /** Renderiza los campos y fotografias del editor activo. */
  function renderEditor(onSave: () => void, saveLabel: string) {
    const totalImages = existingImages.length + newFiles.length

    return (
      <div className="space-y-4 border-t border-border pt-4">
        <BicycleFields
          idPrefix={
            editorMode?.kind === "edit"
              ? `work-order-bike-${editorMode.bicycleId}`
              : "work-order-bike-new"
          }
          value={draft}
          disabled={isSaving}
          onChange={(field, value) =>
            setDraft((current) => ({ ...current, [field]: value }))
          }
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Fotografias del estado de ingreso</Label>
            <span className="text-xs text-muted-foreground">
              {totalImages}/{MAX_BICYCLE_IMAGES}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {existingImages.map((image, index) => (
              <ImageUpload
                key={image}
                label=""
                imagePreview={image}
                disabled={isSaving}
                onChange={(_, preview) => {
                  if (!preview) {
                    setExistingImages((current) =>
                      current.filter((_, item) => item !== index)
                    )
                  }
                }}
              />
            ))}
            {newPreviews.map((preview, index) => (
              <ImageUpload
                key={preview}
                label=""
                imagePreview={preview}
                disabled={isSaving}
                onChange={(_, nextPreview) => {
                  if (!nextPreview) removeNewImage(index)
                }}
              />
            ))}
            {totalImages < MAX_BICYCLE_IMAGES && (
              <ImageUpload
                label=""
                inputId="work-order-bike-add-image"
                imagePreview={null}
                disabled={isSaving}
                onChange={addImage}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => resetEditor()}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={isSaving} onClick={onSave}>
            {isSaving && <Loader2 className="animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-1.5 font-bold text-foreground">
          <Wrench className="h-4.5 w-4.5 text-primary" />
          Bicicletas ({bicycles.length})
        </h4>
        {canCreate && !editorMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={startCreating}
          >
            <Plus className="h-4 w-4" />
            Agregar bicicleta
          </Button>
        )}
      </div>

      {editorMode?.kind === "create" && (
        <div className="rounded-xl border border-border bg-white p-4 dark:bg-popover">
          <h5 className="-mx-4 -mt-4 bg-muted/40 p-3 font-semibold text-foreground">
            Nueva bicicleta
          </h5>
          {renderEditor(handleCreate, "Agregar bicicleta")}
        </div>
      )}

      <div className="space-y-3">
        {bicycles.length === 0 && !editorMode ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No hay bicicletas asociadas a esta orden.
          </div>
        ) : null}

        {bicycles.map((bicycle) => {
          const isEditing =
            editorMode?.kind === "edit" &&
            editorMode.bicycleId === bicycle.idBicicleta
          const images = bicycle.imagenes ?? []

          return (
            <div
              key={bicycle.idBicicleta}
              className="rounded-xl border border-border bg-white p-4 dark:bg-popover"
            >
              <div
                className={`flex items-start justify-between gap-3 ${
                  isEditing ? "-mx-4 -mt-4 bg-muted/40 p-3" : ""
                }`}
              >
                <div className="space-y-0.5">
                  <h5 className="font-bold text-foreground">
                    {bicycle.marca} {bicycle.modelo}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Color:{" "}
                    <span className="font-medium text-foreground">
                      {bicycle.color}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {canUpdate && !editorMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${bicycle.marca} ${bicycle.modelo}`}
                      onClick={() => startEditing(bicycle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && !editorMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Eliminar ${bicycle.marca} ${bicycle.modelo}`}
                      onClick={() => setDeleteTarget(bicycle)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() =>
                        setOpenBikes((current) => ({
                          ...current,
                          [bicycle.idBicicleta]: !current[bicycle.idBicicleta],
                        }))
                      }
                    >
                      {openBikes[bicycle.idBicicleta]
                        ? "Ocultar detalles"
                        : "Ver detalles"}
                      {openBikes[bicycle.idBicicleta] ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {isEditing
                ? renderEditor(() => handleUpdate(bicycle), "Guardar cambios")
                : openBikes[bicycle.idBicicleta] && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {bicycle.descripcion && (
                        <div>
                          <span className="mb-1 block text-xs text-muted-foreground">
                            Descripcion / Estado inicial
                          </span>
                          <p className="rounded-lg border border-border bg-background p-2.5 text-xs italic">
                            {bicycle.descripcion}
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Fotografias de ingreso
                          </span>
                          {images.length > 0 && (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {images.length}{" "}
                              {images.length === 1
                                ? "fotografia"
                                : "fotografias"}
                            </span>
                          )}
                        </div>

                        {images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {images.map((image, index) => (
                              <button
                                key={`${image}-${index}`}
                                type="button"
                                className="aspect-video overflow-hidden rounded-lg border border-border bg-background"
                                onClick={() =>
                                  onPreviewImages(
                                    images,
                                    index,
                                    `${bicycle.marca} ${bicycle.modelo}`
                                  )
                                }
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image}
                                  alt={`${bicycle.marca} ${bicycle.modelo} - fotografia ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-border bg-background py-6 text-center text-xs text-muted-foreground">
                            No hay fotografias registradas
                          </div>
                        )}
                      </div>
                    </div>
                  )}
            </div>
          )
        })}
      </div>

      <StatusToggleDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
        title="¿Eliminar bicicleta definitivamente?"
        description={
          deleteTarget
            ? `Se eliminara ${deleteTarget.marca} ${deleteTarget.modelo}, incluyendo sus fotografias. Esta accion no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar bicicleta"
        submittingLabel="Eliminando..."
        actionVariant="destructive"
        isSubmitting={isDeleting}
        onConfirm={handleDelete}
      />
    </section>
  )
}
