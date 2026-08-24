"use client";

import React, { useRef } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ImageUploadProps {
  label?: string;
  imagePreview: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function ImageUpload({
  label = "Imagen (Opcional)",
  imagePreview,
  onChange,
  maxSizeInMB = 5,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        `Tipo de archivo no permitido. Solo se aceptan: ${allowedTypes
          .map((t) => t.replace("image/", "").toUpperCase())
          .join(", ")}`
      );
      return;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`La imagen supera el tamaño máximo de ${maxSizeInMB} MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange(file, previewUrl);
  };

  const handleRemove = () => {
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>}

      {imagePreview ? (
        <div className="group relative h-36 w-36 overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Vista previa"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Button
            variant="destructive"
            size="icon"
            type="button"
            disabled={disabled}
            onClick={handleRemove}
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full opacity-90 transition-opacity hover:opacity-100 shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="h-36 w-full flex-col gap-2 border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <ImageIcon className="h-8 w-8 stroke-[1.5]" />
          <span className="text-sm font-medium">
            Haz clic para seleccionar una imagen
          </span>
          <span className="text-xs text-muted-foreground">
            {allowedTypes
              .map((t) => t.replace("image/", "").toUpperCase())
              .join(", ")}{" "}
            — Máx. {maxSizeInMB} MB
          </span>
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
