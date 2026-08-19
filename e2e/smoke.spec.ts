// tests/smoke.spec.ts
import { test, expect } from '@playwright/test';

const URL_BASE = 'http://localhost:3000';
const EMAIL_PRUEBA = 'admin@urbancycling.cl';
const PASSWORD_PRUEBA = 'admin123';   

test.describe('Smoke Tests E2E (UC-96)', () => {
  
  test('Flujo E2E: Login exitoso y navegación a Órdenes de Trabajo', async ({ page }) => {
    
    // 1. Navegar a la página de Sign In
    await page.goto(`${URL_BASE}/sign-in`);

    // 2. Verificar que el formulario cargó
    await expect(page.getByText('Iniciar sesion')).toBeVisible();

    // 3. Llenar credenciales
    await page.fill('input[name="email"]', EMAIL_PRUEBA);
    await page.fill('input[name="password"]', PASSWORD_PRUEBA);

    // 4. Hacer clic en entrar
    await page.click('button[type="submit"]');

    // 5. Verificar que nos redirige al Dashboard (ruta principal /)
    await page.waitForURL(URL_BASE);
    await expect(page.getByText('Bienvenido')).toBeVisible();

    // 6. Probar la navegación del Sidebar (Ir a Órdenes de Trabajo)
    // Hacemos clic en el enlace del sidebar
    await page.click('a[href="/ordenes-trabajo"]');

    // 7. Esperar a que cargue la vista de Órdenes
    await page.waitForURL(`${URL_BASE}/ordenes-trabajo`);
    
    // 8. Verificar que el título y el botón de "+ Nueva Orden" existen
    await expect(page.locator('h1', { hasText: 'Órdenes de Trabajo' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Nueva Orden' })).toBeVisible();
  });

});