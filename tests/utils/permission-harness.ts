import { expect, vi } from "vitest";
import * as requirePermissionModule from "@/lib/require-permission";
import { NextResponse } from "next/server";

/**
 * Harness para testear que un endpoint está protegido.
 * @param routeHandler La función GET, POST, PATCH, DELETE a probar
 * @param method Método HTTP (GET, POST...)
 * @param mockBody Body opcional para peticiones POST/PATCH
 * @param routeParams Parámetros dinámicos de la URL (ej: { id: "1" })
 */
export async function testEndpointProtection(
  routeHandler: Function,
  method: string = "GET",
  mockBody: any = {},
  routeParams: Record<string, string> = {}
) {
  // 1. Mockeamos la función para simular que NO hay sesión o faltan permisos (403)
  const mockSpy = vi.spyOn(requirePermissionModule, "requirePermission").mockResolvedValueOnce({
    session: null,
    response: new NextResponse("Sin permisos", { status: 403 }),
  });

  // 2. Creamos la Request falsa
  const isBodyAllowed = ["POST", "PATCH", "PUT"].includes(method.toUpperCase());
  const req = new Request(`http://localhost/api/test`, {
    method,
    body: isBodyAllowed ? JSON.stringify(mockBody) : undefined,
  });

  // 3. Next.js App Router requiere que los params sean una Promesa en sus versiones recientes
  const context = { params: Promise.resolve(routeParams) };

  // 4. Ejecutamos la ruta
  const response: NextResponse = await routeHandler(req, context);

  // 5. Validaciones del DoD: Debe fallar con 403 y devolver "Sin permisos"
  expect(response.status).toBe(403);
  const text = await response.text();
  expect(text).toBe("Sin permisos");

  // 6. Limpiamos
  mockSpy.mockRestore();
}