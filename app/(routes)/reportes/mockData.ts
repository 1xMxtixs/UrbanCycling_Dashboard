import type { ReportsData, DateRange, TimeSeriesPoint } from "./types"

export function getMockReportsData(range: DateRange): ReportsData {
  const fromTime = new Date(range.from).getTime()
  const toTime = new Date(range.to).getTime()
  const diffDays = Math.max(1, Math.round((toTime - fromTime) / (1000 * 60 * 60 * 24)) + 1)

  const isToday = diffDays === 1
  const multiplier = isToday ? 1 : Math.min(diffDays, 30)

  // Generación adaptativa de serie temporal según diffDays
  const series: TimeSeriesPoint[] = []

  if (diffDays <= 7) {
    // Granularidad diaria
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    for (let i = 0; i < diffDays; i++) {
      const cur = new Date(fromTime)
      cur.setDate(cur.getDate() + i)
      const dayLabel = `${dayNames[cur.getDay()]} ${cur.getDate()}`
      const factor = (i % 2 === 0 ? 1.15 : 0.85)
      series.push({
        label: dayLabel,
        laborAmount: Math.round(48500 * factor),
        partsAmount: Math.round(36200 * factor * 0.95),
      })
    }
  } else if (diffDays <= 31) {
    // Granularidad semanal (4 semanas)
    const weeksCount = Math.min(5, Math.ceil(diffDays / 7))
    for (let w = 1; w <= weeksCount; w++) {
      const factor = 1 + (w * 0.1)
      series.push({
        label: `Semana ${w}`,
        laborAmount: Math.round((48500 * 6 * factor) / 2),
        partsAmount: Math.round((36200 * 6 * factor) / 2),
      })
    }
  } else {
    // Granularidad mensual / quincenal
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const startMonth = new Date(fromTime).getMonth()
    for (let m = 0; m < 4; m++) {
      const mIdx = (startMonth + m) % 12
      series.push({
        label: months[mIdx],
        laborAmount: Math.round(48500 * 18 * (1 + m * 0.08)),
        partsAmount: Math.round(36200 * 18 * (1 + m * 0.08)),
      })
    }
  }

  // Totales calculados a partir de la serie o multiplicador base
  const totalLabor = series.reduce((acc, s) => acc + s.laborAmount, 0)
  const totalParts = series.reduce((acc, s) => acc + s.partsAmount, 0)
  const totalRev = totalLabor + totalParts
  const todayRev = 184990

  return {
    financialSummary: {
      totalRevenue: totalRev,
      todayRevenue: todayRev,
      totalWorkOrders: Math.max(2, Math.round(3.5 * multiplier)),
      workOrdersFinished: Math.max(1, Math.round(2.8 * multiplier)),
      workOrdersInProgress: Math.max(1, Math.round(0.7 * multiplier)),
    },
    laborVsParts: {
      laborRevenue: totalLabor,
      partsRevenue: totalParts,
      series,
    },
    paymentMethods: [
      {
        method: "debito",
        label: "Redcompra / Débito",
        amount: Math.round(totalRev * 0.48),
        percentage: 48,
        count: Math.max(3, Math.round(5 * multiplier)),
        color: "#06b6d4", // Cyan
      },
      {
        method: "efectivo",
        label: "Efectivo",
        amount: Math.round(totalRev * 0.26),
        percentage: 26,
        count: Math.max(2, Math.round(3 * multiplier)),
        color: "#10b981", // Emerald
      },
      {
        method: "credito",
        label: "Tarjeta de Crédito",
        amount: Math.round(totalRev * 0.16),
        percentage: 16,
        count: Math.max(1, Math.round(2 * multiplier)),
        color: "#8b5cf6", // Violet
      },
      {
        method: "transferencia",
        label: "Transferencia Bancaria",
        amount: Math.round(totalRev * 0.10),
        percentage: 10,
        count: Math.max(1, Math.round(1 * multiplier)),
        color: "#f59e0b", // Amber
      },
    ],
    topProducts: [
      {
        id: "prod-1",
        ranking: 1,
        name: "Cámara Kenda 700x23/25c Válvula Francesa",
        sku: "TUB-700-KEN",
        category: "Cámaras & Neumáticos",
        quantitySold: 14 * multiplier,
        totalRevenue: 6990 * 14 * multiplier,
      },
      {
        id: "prod-2",
        ranking: 2,
        name: "Pastillas de Freno Shimano B01S / B03S Resina",
        sku: "BRK-SHI-B01S",
        category: "Frenos",
        quantitySold: 9 * multiplier,
        totalRevenue: 8990 * 9 * multiplier,
      },
      {
        id: "prod-3",
        ranking: 3,
        name: "Cadena Shimano Deore 10V HG54",
        sku: "CHN-SHI-HG54",
        category: "Transmisión",
        quantitySold: 6 * multiplier,
        totalRevenue: 18990 * 6 * multiplier,
      },
      {
        id: "prod-4",
        ranking: 4,
        name: "Lubricante Cadena Seco Squirt Lube 120ml",
        sku: "LUB-SQU-120",
        category: "Mantenimiento",
        quantitySold: 5 * multiplier,
        totalRevenue: 12990 * 5 * multiplier,
      },
      {
        id: "prod-5",
        ranking: 5,
        name: "Neumático Maxxis Pace 29x2.10 Alambre",
        sku: "TYR-MAX-29P",
        category: "Cámaras & Neumáticos",
        quantitySold: 4 * multiplier,
        totalRevenue: 24990 * 4 * multiplier,
      },
    ],
    supplyConsumption: [
      {
        id: "ins-1",
        code: "INS-DES-01",
        name: "Desengrasante Biodegradable Cadena y Transmisión",
        category: "Químicos Taller",
        quantityUsed: 2.5 * multiplier,
        unit: "L",
        associatedOrdersCount: Math.max(2, Math.round(4 * multiplier)),
        estimatedCost: 14500 * multiplier,
      },
      {
        id: "ins-2",
        code: "INS-MIN-02",
        name: "Líquido de Frenos Mineral Shimano 50ml",
        category: "Hidráulica",
        quantityUsed: 350 * multiplier,
        unit: "ml",
        associatedOrdersCount: Math.max(1, Math.round(3 * multiplier)),
        estimatedCost: 18900 * multiplier,
      },
      {
        id: "ins-3",
        code: "INS-GRA-03",
        name: "Grasa de Montaje y Rodamientos Cerámica PTFE",
        category: "Lubricación",
        quantityUsed: 180 * multiplier,
        unit: "gr",
        associatedOrdersCount: Math.max(2, Math.round(5 * multiplier)),
        estimatedCost: 9800 * multiplier,
      },
      {
        id: "ins-4",
        code: "INS-CAB-04",
        name: "Cable de Cambio Acero Inoxidable Pulido Slick",
        category: "Cables y Fundas",
        quantityUsed: 8 * multiplier,
        unit: "unid",
        associatedOrdersCount: Math.max(2, Math.round(6 * multiplier)),
        estimatedCost: 16000 * multiplier,
      },
      {
        id: "ins-5",
        code: "INS-FUN-05",
        name: "Funda de Cambio SP41 Shimano Negra",
        category: "Cables y Fundas",
        quantityUsed: 5.5 * multiplier,
        unit: "m",
        associatedOrdersCount: Math.max(1, Math.round(4 * multiplier)),
        estimatedCost: 11000 * multiplier,
      },
    ],
  }
}
