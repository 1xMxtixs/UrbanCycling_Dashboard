"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bike,
  Palette,
  UserRound,
  Wrench,
  Calendar,
  ExternalLink,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { FormDialog } from "@/components/forms/FormDialog";
import { Button } from "@/components/ui/button";
import { WorkOrderStatusBadge } from "@/components/common/WorkOrderStatusBadge/WorkOrderStatusBadge";
import { DataField } from "@/components/common/DataField";
import {
  formatClientName,
  formatCLP,
  formatDateCL,
  formatRut,
} from "@/lib/formatters";
import { ordenAbierta } from "../../lib/bicycle-editor";
import { cn } from "@/lib/utils";
import type { Bicicleta } from "../../types";

export type ModalDetalleBicicletaProps = {
  bicicleta: Bicicleta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (bicicleta: Bicicleta) => void;
};

export function ModalDetalleBicicleta({
  bicicleta,
  open,
  onOpenChange,
  onEdit,
}: ModalDetalleBicicletaProps) {
  // Mantener la última bicicleta en memoria para que no desaparezca durante la animación de cierre
  const [cachedBicicleta, setCachedBicicleta] = useState<Bicicleta | null>(bicicleta);
  const [activeBicicletaId, setActiveBicicletaId] = useState<number | null>(
    bicicleta?.idBicicleta ?? null
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (bicicleta && bicicleta.idBicicleta !== activeBicicletaId) {
    setCachedBicicleta(bicicleta);
    setActiveBicicletaId(bicicleta.idBicicleta);
    setSelectedImageIndex(0);
  }

  const bici = bicicleta ?? cachedBicicleta;

  // Si la imagen seleccionada queda fuera de la vista en el carrusel de miniaturas, hacer scroll suave hacia ella
  useEffect(() => {
    const thumbEl = thumbnailRefs.current[selectedImageIndex];
    if (thumbEl) {
      thumbEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedImageIndex]);

  // Extraer todas las imágenes disponibles
  const imagenes = useMemo(() => {
    if (!bici) return [];
    const lista: string[] = [];
    if (bici.imagenes && bici.imagenes.length > 0) {
      for (const img of bici.imagenes) {
        if (img.urlImagen) lista.push(img.urlImagen);
      }
    }
    if (lista.length === 0 && bici.imagenUrl) {
      lista.push(bici.imagenUrl);
    }
    return lista;
  }, [bici]);

  if (!bici) return null;

  const cliente = bici.ordenDeTrabajo?.cliente;
  const nombreCliente = formatClientName(cliente);
  const rutCliente = cliente?.rut ? formatRut(cliente.rut) : null;
  const estadoOrden = bici.ordenDeTrabajo?.estadoOrden ?? "Sin estado";
  const puedeEditar = Boolean(onEdit && ordenAbierta(estadoOrden));

  const totalImagenes = imagenes.length;
  const currentImageUrl = imagenes[selectedImageIndex] ?? null;

  const irAImagenAnterior = () => {
    if (totalImagenes <= 1) return;
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : totalImagenes - 1));
  };

  const irAImagenSiguiente = () => {
    if (totalImagenes <= 1) return;
    setSelectedImageIndex((prev) => (prev < totalImagenes - 1 ? prev + 1 : 0));
  };

  const dialogTitle = (
    <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bike className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-foreground">
            {bici.marca} {bici.modelo}
          </div>
          <p className="text-xs font-normal text-muted-foreground">
            Bicicleta #{bici.idBicicleta} • Color {bici.color}
          </p>
        </div>
      </div>

      {bici.ordenDeTrabajo?.estadoOrden && (
        <div className="flex items-center gap-2">
          <WorkOrderStatusBadge
            estado={estadoOrden}
            nombre={bici.ordenDeTrabajo.estadoOrdenNombre}
            fechaEntregaEstimada={bici.ordenDeTrabajo.fechaEntregaEstimada}
            className="h-6 text-xs"
          />
        </div>
      )}
    </div>
  );

  const dialogFooter = (
    <div className="flex w-full items-center justify-between gap-2">
      <div>
        {puedeEditar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              onEdit?.(bici);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Editar bicicleta</span>
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="cursor-pointer"
        onClick={() => onOpenChange(false)}
      >
        Cerrar
      </Button>
    </div>
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      size="4xl"
      footer={dialogFooter}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Galería Multimedia */}
        <div className="flex flex-col gap-3 lg:col-span-7">
          {/* Foto principal grande */}
          <div
            className={cn(
              "group/gallery relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl",
              currentImageUrl
                ? "border-0 bg-transparent"
                : "border border-border/80 bg-popover"
            )}
          >
            {currentImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt={`${bici.marca} ${bici.modelo} - foto ${selectedImageIndex + 1}`}
                className="h-full w-full object-contain transition-transform duration-300"
                loading="eager"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Bike className="h-14 w-14 stroke-[1.2] text-muted-foreground/40" />
                <p className="text-xs font-medium">Sin fotografías registradas</p>
              </div>
            )}

            {/* Controles de navegación anterior / siguiente si hay múltiples fotos */}
            {totalImagenes > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    irAImagenAnterior();
                  }}
                  aria-label="Foto anterior"
                  className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-popover/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-popover hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    irAImagenSiguiente();
                  }}
                  aria-label="Foto siguiente"
                  className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-popover/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-popover hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Contador de foto */}
                <div className="absolute bottom-2.5 right-2.5 rounded-full border border-border/80 bg-popover/90 px-2 py-0.5 text-[10px] font-medium leading-none text-foreground/90 shadow-xs backdrop-blur-md">
                  {selectedImageIndex + 1} / {totalImagenes}
                </div>
              </>
            )}
          </div>

          {/* Fila horizontal de miniaturas debajo de la foto grande */}
          {totalImagenes > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
              {imagenes.map((url, idx) => {
                const activa = idx === selectedImageIndex;
                return (
                  <button
                    key={`${url}-${idx}`}
                    ref={(el) => {
                      thumbnailRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`Seleccionar imagen ${idx + 1}`}
                    aria-current={activa ? "true" : undefined}
                    className={cn(
                      "relative aspect-[16/10] h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-popover transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      activa
                        ? "border-primary ring-2 ring-primary/30 shadow-xs"
                        : "border-border/60 opacity-60 hover:opacity-100 hover:border-primary/50"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Miniatura ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Especificaciones y Ficha Técnica con color base */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Especificaciones básicas */}
          <div className="rounded-xl border border-border/80 bg-popover p-3.5 shadow-2xs">
            <h4 className="mb-2.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Especificaciones
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <DataField
                variant="detail-item"
                icon={Palette}
                label="Color"
                value={bici.color}
              />
              <DataField
                variant="detail-item"
                icon={Bike}
                label="Modelo"
                value={`${bici.marca} ${bici.modelo}`}
              />
            </div>
          </div>

          {/* Diagnóstico y Observaciones de Taller */}
          <div className="rounded-xl border border-border/80 bg-popover p-3.5 shadow-2xs">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Wrench className="h-4 w-4" />
              <h4 className="text-xs font-bold tracking-wider uppercase">
                Diagnóstico & Observaciones
              </h4>
            </div>
            <div className="max-h-20 overflow-y-auto overscroll-contain rounded-lg border border-border/60 bg-popover p-2.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {bici.descripcion || "Sin observaciones adicionales registradas para esta bicicleta."}
            </div>
          </div>

          {/* Información de la Orden de Trabajo vinculada */}
          <div className="rounded-xl border border-border/80 bg-popover p-3.5 shadow-2xs">
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Orden de Trabajo
              </h4>
              <Link
                href={`/punto-ventas/ordenes-trabajo?search=${bici.idOrdenDeTrabajo}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Orden #{bici.idOrdenDeTrabajo}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <DataField
                variant="inline"
                icon={UserRound}
                label="Cliente"
                value={nombreCliente}
                secondaryValue={rutCliente ? `(${rutCliente})` : undefined}
              />

              {bici.ordenDeTrabajo?.fechaEntregaEstimada && (
                <DataField
                  variant="inline"
                  icon={Calendar}
                  label="Entrega estimada"
                  value={formatDateCL(
                    typeof bici.ordenDeTrabajo.fechaEntregaEstimada === "object"
                      ? bici.ordenDeTrabajo.fechaEntregaEstimada.toISOString()
                      : bici.ordenDeTrabajo.fechaEntregaEstimada
                  )}
                />
              )}

              {bici.ordenDeTrabajo?.total !== undefined &&
                bici.ordenDeTrabajo.total !== null && (
                  <DataField
                    variant="inline"
                    icon={Receipt}
                    label="Monto orden"
                    value={formatCLP(bici.ordenDeTrabajo.total)}
                  />
                )}
            </div>
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
