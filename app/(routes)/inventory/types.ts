export type ProductImage = {
  idImagenProducto: number;
  idProducto: number;
  url: string;
};

export type InventoryCategory = {
  idCategoria: number;
  nombre: string;
  descripcion?: string | null;
  estado?: string;
  productosAsociados?: number;
};

export type ProductColumn = {
  idProducto: number;
  tipoProducto: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number | string;
  precioCompra: number | string;
  costoPromedio: number | string;
  stockActual: number;
  stockMinimo: number;
  estado: string;
  imagenesProducto?: ProductImage[];
  categoriasProducto?: InventoryCategory[];
};

export interface FormCreateInventoryProps {
  setOpenModalCreate: (open: boolean) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  product?: import("./components/ListInventory/columns").ProductColumn;
  onCompleted?: () => void;
  onCancel?: () => void;
}

export type ServiceColumn = {
  idServicio: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  estado: string;
};
