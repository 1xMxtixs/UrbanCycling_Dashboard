export type ProductImage = {
  idImagenProducto: number;
  idProducto: number;
  url: string;
};

export type ProductColumn = {
  idProducto: number;
  tipoProducto: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number | string;
  stockActual: number;
  stockMinimo: number;
  estado: string;
  imagenesProducto?: ProductImage[];
};

export interface FormCreateInventoryProps {
  setOpenModalCreate: (open: boolean) => void;
}
