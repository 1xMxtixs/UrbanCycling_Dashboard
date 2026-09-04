// __tests__/unit/tax-document.test.ts
import { describe, it, expect } from "vitest";
import { calculateIncludedIva, calcularMontos, normalizeTaxDocumentOrigin } from "@/lib/tax-document";

describe("Tax Document Utils", () => {
  describe("calcularMontos", () => {
    it("debe calcular correctamente el neto y el IVA (19%)", () => {
      // 1000 subtotal, 0 descuento -> Total 1000. Neto = 840, IVA = 160
      const result = calcularMontos(1000, 0);
      expect(result.montoTotal).toBe(1000);
      expect(result.montoNeto).toBe(840);
      expect(result.montoIva).toBe(160);
    });

    it("debe aplicar el descuento global correctamente", () => {
      const result = calcularMontos(1000, 200);
      expect(result.montoTotal).toBe(800);
      expect(result.montoNeto).toBe(672); // 800 / 1.19
      expect(result.montoIva).toBe(128);  // 800 - 672
    });

    it("nunca debe retornar un monto total negativo", () => {
      const result = calcularMontos(500, 1000);
      expect(result.montoTotal).toBe(0);
      expect(result.montoNeto).toBe(0);
      expect(result.montoIva).toBe(0);
    });
  });

  describe("calculateIncludedIva", () => {
    it("debe desglosar el IVA de un monto total dado", () => {
      const result = calculateIncludedIva(1190);
      expect(result.montoNeto).toBe(1000);
      expect(result.montoIva).toBe(190);
    });
  });

  describe("normalizeTaxDocumentOrigin", () => {
    it("debe identificar 'venta' correctamente", () => {
      expect(normalizeTaxDocumentOrigin(" Venta ")).toBe("venta");
    });
    it("debe identificar 'orden-trabajo' de varias formas", () => {
      expect(normalizeTaxDocumentOrigin("orden_de_trabajo")).toBe("orden-trabajo");
      expect(normalizeTaxDocumentOrigin("ordenDeTrabajo")).toBe("orden-trabajo");
    });
    it("debe retornar null para origenes invalidos", () => {
      expect(normalizeTaxDocumentOrigin("inventario")).toBeNull();
    });
  });
});