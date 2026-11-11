export interface RegionChile {
  nombre: string
  ciudades: string[]
}

export const REGIONES_CHILE: RegionChile[] = [
  {
    nombre: "Arica y Parinacota",
    ciudades: ["Arica", "Putre", "Camarones", "General Lagos"],
  },
  {
    nombre: "Tarapacá",
    ciudades: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica", "Huara", "Camiña", "Colchane"],
  },
  {
    nombre: "Antofagasta",
    ciudades: [
      "Antofagasta",
      "Calama",
      "Tocopilla",
      "Mejillones",
      "Taltal",
      "San Pedro de Atacama",
      "Sierra Gorda",
      "María Elena",
    ],
  },
  {
    nombre: "Atacama",
    ciudades: [
      "Copiapó",
      "Vallenar",
      "Caldera",
      "Chañaral",
      "Diego de Almagro",
      "Huasco",
      "Tierra Amarilla",
      "Freirina",
      "Alto del Carmen",
    ],
  },
  {
    nombre: "Coquimbo",
    ciudades: [
      "La Serena",
      "Coquimbo",
      "Ovalle",
      "Illapel",
      "Vicuña",
      "Salamanca",
      "Los Vilos",
      "Andacollo",
      "Combarbalá",
      "Monte Patria",
    ],
  },
  {
    nombre: "Valparaíso",
    ciudades: [
      "Valparaíso",
      "Viña del Mar",
      "Quilpué",
      "Villa Alemana",
      "Concón",
      "Quillota",
      "San Antonio",
      "Los Andes",
      "San Felipe",
      "La Calera",
      "Limache",
      "La Ligua",
      "Casablanca",
    ],
  },
  {
    nombre: "Metropolitana de Santiago",
    ciudades: [
      "Santiago",
      "Providencia",
      "Las Condes",
      "Ñuñoa",
      "Maipú",
      "La Florida",
      "Puente Alto",
      "San Bernardo",
      "Colina",
      "Lampa",
      "Melipilla",
      "Talagante",
      "Buin",
      "Paine",
      "Peñaflor",
      "Pudahuel",
      "Quilicura",
      "San Miguel",
      "Vitacura",
      "Lo Barnechea",
      "Macul",
      "Peñalolén",
      "La Reina",
      "Estación Central",
      "Independencia",
      "Recoleta",
      "Renca",
      "Quinta Normal",
    ],
  },
  {
    nombre: "Libertador General Bernardo O'Higgins",
    ciudades: [
      "Rancagua",
      "Machalí",
      "Rengo",
      "San Fernando",
      "Santa Cruz",
      "Pichilemu",
      "Graneros",
      "San Vicente de Tagua Tagua",
      "Chimbarongo",
    ],
  },
  {
    nombre: "Maule",
    ciudades: [
      "Talca",
      "Curicó",
      "Linares",
      "Constitución",
      "Cauquenes",
      "Parral",
      "San Javier",
      "Molina",
      "San Clemente",
    ],
  },
  {
    nombre: "Ñuble",
    ciudades: [
      "Chillán",
      "Chillán Viejo",
      "San Carlos",
      "Bulnes",
      "Quirihue",
      "Yungay",
      "Coelemu",
      "San Nicolás",
    ],
  },
  {
    nombre: "Biobío",
    ciudades: [
      "Concepción",
      "Talcahuano",
      "San Pedro de la Paz",
      "Coronel",
      "Chiguayante",
      "Los Ángeles",
      "Hualpén",
      "Lota",
      "Tomé",
      "Penco",
      "Arauco",
      "Cañete",
      "Lebu",
    ],
  },
  {
    nombre: "La Araucanía",
    ciudades: [
      "Temuco",
      "Padre Las Casas",
      "Villarrica",
      "Pucón",
      "Angol",
      "Victoria",
      "Lautaro",
      "Nueva Imperial",
      "Traiguén",
    ],
  },
  {
    nombre: "Los Ríos",
    ciudades: [
      "Valdivia",
      "La Unión",
      "Río Bueno",
      "Panguipulli",
      "Paillaco",
      "Los Lagos",
      "Mariquina",
      "Futrono",
    ],
  },
  {
    nombre: "Los Lagos",
    ciudades: [
      "Puerto Montt",
      "Puerto Varas",
      "Osorno",
      "Castro",
      "Ancud",
      "Frutillar",
      "Calbuco",
      "Quellón",
      "Llanquihue",
      "Purranque",
    ],
  },
  {
    nombre: "Aysén del General Carlos Ibáñez del Campo",
    ciudades: ["Coyhaique", "Puerto Aysén", "Chile Chico", "Cochrane", "Cisnes"],
  },
  {
    nombre: "Magallanes y de la Antártica Chilena",
    ciudades: ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos"],
  },
]

export function getRegionChile(nombreOParcial: string | undefined | null) {
  if (!nombreOParcial) return undefined
  const query = nombreOParcial.trim().toLowerCase()
  return REGIONES_CHILE.find(
    (r) =>
      r.nombre.toLowerCase() === query ||
      r.nombre.toLowerCase().includes(query) ||
      query.includes(r.nombre.toLowerCase())
  )
}

