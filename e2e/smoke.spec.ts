// tests/smoke.spec.ts
import { test, expect } from '@playwright/test';

const URL_BASE = process.env.E2E_BASE_URL ?? 'https://urban-cycling-dashboard-mxtixs-projects.vercel.app';
const EMAIL_PRUEBA = process.env.E2E_EMAIL ?? 'qa.admin.db@urbancycling.cl';
const PASSWORD_PRUEBA = process.env.E2E_PASSWORD;

if (!PASSWORD_PRUEBA) {
  throw new Error('Falta la variable de entorno E2E_PASSWORD (credencial de QA) para correr los tests E2E.');
}

test.describe('Smoke Tests E2E (UC-96)', () => {
  
  test('Flujo E2E: Login exitoso y navegación a Órdenes de Trabajo', async ({ page }) => {
    
    // 1. Navegar a la página de Sign In
    await page.goto(`${URL_BASE}/sign-in`);

    // 2. Verificar que el formulario cargó
    await expect(page.getByText('Iniciar sesion')).toBeVisible();

    // 3. Llenar credenciales
    // Se usa pressSequentially en vez de fill: en WebKit, fill() no siempre
    // dispara el onChange de React de forma confiable en inputs controlados,
    // dejando el estado interno vacío aunque el DOM muestre el valor.
    await page.locator('input[name="email"]').pressSequentially(EMAIL_PRUEBA);
    await page.locator('input[name="password"]').pressSequentially(PASSWORD_PRUEBA);

    // 4. Hacer clic en entrar
    await page.click('button[type="submit"]');

    // 5. Verificar que nos redirige al Dashboard (ruta principal /)
    await page.waitForURL(URL_BASE);
    await expect(page.getByText('Bienvenido')).toBeVisible();

    // 6. Probar la navegación del Sidebar (Ir a Punto de Venta)
    // Hacemos clic en el enlace del sidebar
    await page.click('a[href="/punto-ventas"]:visible');

    // 7. Esperar a que cargue la vista de Punto de Venta
    // (el tab "Órdenes de Trabajo" es el que está activo por defecto)
    await page.waitForURL(`${URL_BASE}/punto-ventas`);

    // 8. Verificar que el título y el botón de "+ Nueva Orden" existen
    await expect(page.locator('h1', { hasText: 'Órdenes de Trabajo' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nueva Orden/i })).toBeVisible();
  });

});