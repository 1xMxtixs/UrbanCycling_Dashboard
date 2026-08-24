"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";

export type DataFieldVariant = "detail-item" | "table-cell" | "inline";

export interface DataFieldProps {
  label?: React.ReactNode;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  icon?: LucideIcon;
  variant?: DataFieldVariant;
  className?: string;
  /** @deprecated Kept for compatibility; visual styling is controlled globally. */
  valueClassName?: string;
}

export function DataField({
  label,
  value,
  secondaryValue,
  icon: Icon,
  variant = "detail-item",
  className = "",
  valueClassName: _valueClassName,
}: DataFieldProps) {
  // Variante 1: Celdas compuestas en Tablas (ej. Nombre + RUT abajo)
  if (variant === "table-cell") {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="text-sm font-semibold text-foreground">
            {value}
          </span>
        </div>
        {secondaryValue && (
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            {secondaryValue}
          </span>
        )}
      </div>
    );
  }

  // Variante 2: En línea (ej. Tarjetas, filas de datos compactos con icono)
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />}
        {label && <span>{label}:</span>}
        <span className="text-sm font-semibold text-foreground">
          {value}
        </span>
        {secondaryValue && (
          <span className="text-[10px] text-muted-foreground">
            {secondaryValue}
          </span>
        )}
      </div>
    );
  }

  // Variante 3 por defecto: Detail-item (Etiqueta arriba en gris + Valor abajo en negrita)
  return (
    <div className={`space-y-0.5 ${className}`}>
      {label && (
        <div className="flex items-center gap-1">
          {Icon && <Icon className="h-3 w-3 text-muted-foreground shrink-0" />}
          <span className="text-xs text-muted-foreground block font-medium">
            {label}
          </span>
        </div>
      )}
      <div className="text-sm font-semibold text-foreground">
        {value}
      </div>
      {secondaryValue && (
        <span className="text-[10px] text-muted-foreground block">
          {secondaryValue}
        </span>
      )}
    </div>
  );
}
