"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useSession } from "next-auth/react"
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Tags,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { FormDialog } from "@/components/forms/FormDialog"
import { FormSection, RequiredLegend } from "@/components/forms/FormLayout"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PERMISSIONS } from "@/lib/permissions"
import { isRegistroActivo } from "@/lib/registro-status"
import { includesNormalizedText } from "@/lib/search-normalization"
import type { InventoryCategory } from "../../types"

type Category = InventoryCategory & {
  estado: string
  productosAsociados: number
}
type Editor = {
  category: Category | null
  nombre: string
  descripcion: string
  estado: string
}
type Action = { kind: "delete" | "toggle"; category: Category }

export function CategoryManager({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: session } = useSession()
  const permissions = session?.user?.permisos ?? []
  const canCreate = permissions.includes(PERMISSIONS.INVENTORY_CREATE)
  const canUpdate = permissions.includes(PERMISSIONS.INVENTORY_UPDATE)
  const canDelete = permissions.includes(PERMISSIONS.INVENTORY_DELETE)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [blockedDelete, setBlockedDelete] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setLoadError("")
      try {
        const response = await fetch(
          "/api/inventory/categories?includeInactive=true",
          { cache: "no-store", signal: controller.signal }
        )
        const data = await response.json()
        if (!response.ok)
          throw new Error(
            data.message || "No se pudieron cargar las categorías."
          )
        if (!controller.signal.aborted) setCategories(data.categories)
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las categorías."
          )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [open, revision])

  function refresh() {
    setRevision((value) => value + 1)
    window.dispatchEvent(new Event("inventory:categories-changed"))
    window.dispatchEvent(new Event("inventory:refresh"))
  }

  async function mutate(url: string, method: string, body?: object) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok)
      throw new Error(data?.message || "No se pudo guardar el cambio.")
    return data
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault()
    if (!editor || saving) return
    setFormError("")
    setSaving(true)
    try {
      const data = await mutate(
        editor.category
          ? `/api/inventory/categories/${editor.category.idCategoria}`
          : "/api/inventory/categories",
        editor.category ? "PATCH" : "POST",
        {
          nombre: editor.nombre,
          descripcion: editor.descripcion,
          estado: editor.estado,
        }
      )
      toast.success(data.message)
      setEditor(null)
      refresh()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la categoría."
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmAction() {
    if (!action || saving) return
    setSaving(true)
    try {
      const data = await mutate(
        `/api/inventory/categories/${action.category.idCategoria}`,
        action.kind === "delete" ? "DELETE" : "PATCH",
        action.kind === "toggle"
          ? {
              estado: isRegistroActivo(action.category.estado)
                ? "INACTIVO"
                : "ACTIVO",
            }
          : undefined
      )
      toast.success(data.message)
      setAction(null)
      refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la categoría."
      )
      setAction(null)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  const visible = categories.filter(
    (category) =>
      (showInactive || isRegistroActivo(category.estado)) &&
      includesNormalizedText(category.nombre, search)
  )
  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) onOpenChange(value)
        }}
        size="3xl"
        title={
          <span className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" /> Administrar categorías
          </span>
        }
        description="Organiza las categorías disponibles para clasificar los productos del inventario."
        footer={
          <div className="flex justify-end">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar categorías"
                placeholder="Buscar por nombre…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </div>
            {canCreate && (
              <Button
                disabled={saving}
                onClick={() => {
                  setFormError("")
                  setEditor({
                    category: null,
                    nombre: "",
                    descripcion: "",
                    estado: "ACTIVO",
                  })
                }}
              >
                <Plus className="h-4 w-4" /> Nueva categoría
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p role="status" className="text-xs text-muted-foreground">
              {visible.length}{" "}
              {visible.length === 1 ? "categoría" : "categorías"}
            </p>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive-categories"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive-categories" className="text-xs">
                Mostrar inactivas
              </Label>
            </div>
          </div>
          {loading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
            >
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando categorías…
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="space-y-2 rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
            >
              {loadError}
              <div>
                <Button
                  variant="outline"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Productos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((category) => (
                    <TableRow key={category.idCategoria}>
                      <TableCell>
                        <p className="font-semibold">{category.nombre}</p>
                        {category.descripcion && (
                          <p className="mt-1 max-w-xs text-xs break-words whitespace-normal text-muted-foreground">
                            {category.descripcion}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            isRegistroActivo(category.estado)
                              ? "success"
                              : "neutral"
                          }
                          label={
                            isRegistroActivo(category.estado)
                              ? "Activa"
                              : "Inactiva"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {category.productosAsociados}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={saving}
                                aria-label={`Editar ${category.nombre}`}
                                title="Editar"
                                onClick={() => {
                                  setFormError("")
                                  setEditor({
                                    category,
                                    nombre: category.nombre,
                                    descripcion: category.descripcion ?? "",
                                    estado: category.estado,
                                  })
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={saving}
                                aria-label={`${isRegistroActivo(category.estado) ? "Desactivar" : "Reactivar"} ${category.nombre}`}
                                title={
                                  isRegistroActivo(category.estado)
                                    ? "Desactivar"
                                    : "Reactivar"
                                }
                                onClick={() =>
                                  setAction({ kind: "toggle", category })
                                }
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={saving}
                              className="text-destructive hover:text-destructive"
                              aria-label={`Eliminar ${category.nombre}`}
                              title="Eliminar"
                              onClick={() =>
                                category.productosAsociados > 0
                                  ? setBlockedDelete(category)
                                  : setAction({ kind: "delete", category })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {!canUpdate && !canDelete && (
                            <span className="text-xs text-muted-foreground">
                              Solo lectura
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-28 text-center text-sm text-muted-foreground"
                      >
                        {search
                          ? "No se encontraron categorías con ese nombre."
                          : "No hay categorías para mostrar."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </FormDialog>

      {editor && (
        <FormDialog
          open
          onOpenChange={(value) => {
            if (!value && !saving) setEditor(null)
          }}
          size="lg"
          title={editor.category ? "Editar categoría" : "Nueva categoría"}
          description="Define el nombre, la descripción y la disponibilidad de la categoría."
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setEditor(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="inventory-category-form"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {saving ? "Guardando…" : "Guardar categoría"}
              </Button>
            </div>
          }
        >
          <form
            id="inventory-category-form"
            onSubmit={saveCategory}
            className="space-y-5"
          >
            <RequiredLegend />
            <FormSection title="Información de la categoría">
              <div className="space-y-2">
                <Label htmlFor="category-name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="category-name"
                  autoFocus
                  required
                  maxLength={50}
                  value={editor.nombre}
                  disabled={saving}
                  onChange={(event) =>
                    setEditor({ ...editor, nombre: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Descripción</Label>
                <Textarea
                  id="category-description"
                  maxLength={255}
                  rows={3}
                  value={editor.descripcion}
                  disabled={saving}
                  onChange={(event) =>
                    setEditor({ ...editor, descripcion: event.target.value })
                  }
                />
                <p className="text-right text-xs text-muted-foreground">
                  {editor.descripcion.length}/255
                </p>
              </div>
            </FormSection>
            <FormSection
              title="Disponibilidad"
              description="Las categorías inactivas conservan sus productos asociados y dejan de ofrecerse para nuevas asignaciones."
            >
              <Label htmlFor="category-state">Estado</Label>
              <Select
                value={editor.estado}
                onValueChange={(estado) => setEditor({ ...editor, estado })}
                disabled={saving}
              >
                <SelectTrigger id="category-state" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activa</SelectItem>
                  <SelectItem value="INACTIVO">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </FormSection>
            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
          </form>
        </FormDialog>
      )}

      {action && (
        <StatusToggleDialog
          open
          onOpenChange={(value) => {
            if (!value && !saving) setAction(null)
          }}
          entityLabel="categoría"
          entityName={action.category.nombre}
          isActive={isRegistroActivo(action.category.estado)}
          isSubmitting={saving}
          onConfirm={confirmAction}
          title={
            action.kind === "delete"
              ? `¿Eliminar ${action.category.nombre}?`
              : `${isRegistroActivo(action.category.estado) ? "¿Desactivar" : "¿Reactivar"} ${action.category.nombre}?`
          }
          description={
            action.kind === "delete"
              ? "La categoría no tiene productos asociados y se eliminará definitivamente. Esta acción no se puede deshacer."
              : isRegistroActivo(action.category.estado)
                ? "La categoría dejará de estar disponible para nuevas asignaciones. Los productos que ya la tienen conservarán su clasificación."
                : "La categoría volverá a estar disponible al crear y editar productos."
          }
          confirmLabel={
            action.kind === "delete"
              ? "Eliminar categoría"
              : isRegistroActivo(action.category.estado)
                ? "Desactivar"
                : "Reactivar"
          }
          submittingLabel="Guardando…"
          actionVariant={
            action.kind === "delete" || isRegistroActivo(action.category.estado)
              ? "destructive"
              : "default"
          }
        />
      )}
      {blockedDelete && (
        <FormDialog
          open
          onOpenChange={(value) => {
            if (!value) setBlockedDelete(null)
          }}
          size="md"
          title="Categoría con productos asociados"
          description={`${blockedDelete.nombre} está asociada a ${blockedDelete.productosAsociados} ${blockedDelete.productosAsociados === 1 ? "producto" : "productos"}.`}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setBlockedDelete(null)}>
                Cerrar
              </Button>
              {canUpdate && isRegistroActivo(blockedDelete.estado) && (
                <Button
                  onClick={() => {
                    setAction({ kind: "toggle", category: blockedDelete })
                    setBlockedDelete(null)
                  }}
                >
                  Desactivar categoría
                </Button>
              )}
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            No se puede eliminar mientras tenga productos asociados. Puedes
            desactivarla para conservar las clasificaciones, o quitar sus
            asociaciones desde las fichas de los productos.
          </p>
        </FormDialog>
      )}
    </>
  )
}
