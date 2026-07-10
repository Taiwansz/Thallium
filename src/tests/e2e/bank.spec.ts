import { test, expect } from '@playwright/test';

test.describe('Thallium E2E Bank Flow Tests', () => {
  test('should render the landing page with correct brand name and sections', async ({ page }) => {
    await page.goto('/');
    
    // Check brand logo and title in header
    await expect(page.locator('header')).toContainText('THALLIUM');
    
    // Check main hero headline
    await expect(page.locator('h1')).toContainText('A infraestrutura de contabilidade digital');
    
    // Check CTA button
    const startBtn = page.locator('a:has-text("Abrir Conta Digital")');
    await expect(startBtn).toBeVisible();
  });

  test('should navigate to login page and render form controls', async ({ page }) => {
    await page.goto('/login');
    
    // Check Card Title
    await expect(page.locator('h3')).toContainText('Acessar Conta');
    
    // Verify inputs and labels
    await expect(page.locator('label:has-text("Endereço de E-mail")')).toBeVisible();
    await expect(page.locator('label:has-text("Senha de Acesso")')).toBeVisible();
    
    // Verify login submit button
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toContainText('Acessar Painel');
  });

  test('should navigate to registration page and render onboarding form controls', async ({ page }) => {
    await page.goto('/cadastro');
    
    // Check Card Title
    await expect(page.locator('h3')).toContainText('Nova Conta Digital');
    
    // Verify fields
    await expect(page.locator('label:has-text("Nome Completo")')).toBeVisible();
    await expect(page.locator('label:has-text("Cadastro de Pessoa Física (CPF)")')).toBeVisible();
    await expect(page.locator('label:has-text("Endereço de E-mail")')).toBeVisible();
    await expect(page.locator('label:has-text("Senha de Acesso")')).toBeVisible();
    
    // Verify register button
    const registerBtn = page.locator('button[type="submit"]');
    await expect(registerBtn).toContainText('Criar Minha Conta');
  });
});
