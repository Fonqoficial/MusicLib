import { test, expect } from '@playwright/test';

test.describe('Sistema de descarga', () => {
  
  test('debería generar URL de descarga válida', async ({ page }) => {
    // Ir a detalle de partitura
    await page.goto('/partituras/test-score-id');

    // Click en descargar
    const downloadPromise = page.waitForEvent('download');
    await page.click('#download-btn');
    
    const download = await downloadPromise;
    
    // Verificar que se descargó un PDF
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('debería incrementar contador de descargas', async ({ page }) => {
    await page.goto('/partituras/test-score-id');
    
    // Obtener contador inicial
    const initialCount = await page.textContent('#download-count');
    
    // Descargar
    await page.click('#download-btn');
    await page.waitForTimeout(2000);
    
    // Verificar contador incrementado
    const newCount = await page.textContent('#download-count');
    expect(parseInt(newCount!)).toBeGreaterThan(parseInt(initialCount!));
  });

});