export interface ProveedorListado {
  idProveedor: number
  razonSocial: string
  nombreFantasia: string | null
  rut: string
  giro: string
  condicionesDePago: string
  nombreContacto: string | null
  fechaRegistro: string
  estado: string
}

export interface TelefonoProveedor {
  idTelefonoProveedor?: number
  telefono: string
  descripcion?: string | null
}

export interface CorreoProveedor {
  idCorreoProveedor?: number
  correo: string
  descripcion?: string | null
}

export interface DireccionProveedor {
  idDireccionProveedor?: number
  region: string
  ciudad: string
  comuna: string
  calle: string
  numero: string
  unidad?: string | null
  descripcion?: string | null
}

export interface ProveedorDetalle extends ProveedorListado {
  telefonos: TelefonoProveedor[]
  correos: CorreoProveedor[]
  direcciones: DireccionProveedor[]
}

export interface ProveedorFormData {
  razonSocial: string
  nombreFantasia: string
  rut: string
  giro: string
  condicionesDePago: string
  nombreContacto: string

  telefono: string
  

  correo: string
  

  region: string
  ciudad: string
  comuna: string
  calle: string
  numero: string
  unidad: string
  direccionDescripcion: string
}

export const emptyProveedorForm: ProveedorFormData = {
  razonSocial: "",
  nombreFantasia: "",
  rut: "",
  giro: "",
  condicionesDePago: "",
  nombreContacto: "",

  telefono: "",


  correo: "",
  

  region: "",
  ciudad: "",
  comuna: "",
  calle: "",
  numero: "",
  unidad: "",
  direccionDescripcion: "Principal",
}