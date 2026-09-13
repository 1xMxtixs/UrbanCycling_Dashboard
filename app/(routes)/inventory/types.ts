export type ProductImage = {
  idImagenProducto: number;
  idProducto: number;
  url: string;
};

export type InventoryCategory = {
  idCategoria: number;
  nombre: string;
  descripcion?: string | null;
};

export type ProductColumn = {
  idProducto: number;
  tipoProducto: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number | string;
  costoPromedio: number | string;
  stockActual: number;
  stockMinimo: number;
  estado: string;
  imagenesProducto?: ProductImage[];
  categoriasProducto?: InventoryCategory[];
};

export interface FormCreateInventoryProps {
  setOpenModalCreate: (open: boolean) => void;
}
