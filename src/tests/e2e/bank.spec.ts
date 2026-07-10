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
    
    // Verify forgot password link
    const forgotPwdLink = page.locator('a:has-text("Esqueci minha senha")');
    await expect(forgotPwdLink).toBeVisible();
    
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

  test('should navigate to recovery request page and validate email input', async ({ page }) => {
    await page.goto('/login');
    
    // Click recovery link
    await page.click('a:has-text("Esqueci minha senha")');
    await expect(page).toHaveURL(/\/recuperar-senha/);
    
    // Check page title
    await expect(page.locator('h3')).toContainText('Recuperar Senha');
    
    // Try empty submit
    await page.click('button[type="submit"]');
    await expect(page.locator('span:has-text("Endereço de e-mail inválido.")')).toBeVisible();
    
    // Try invalid email
    await page.fill('input[type="email"]', 'invalido-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('span:has-text("Endereço de e-mail inválido.")')).toBeVisible();
  });

  test('should render fallback error on direct redefinir-senha page access and redirect to recovery page', async ({ page }) => {
    // Go straight to redefinir-senha page without access tokens
    await page.goto('/redefinir-senha');
    
    // Verify it handles invalid flow by showing warning/error message
    await expect(page.locator('p')).toContainText('O link de redefinição é inválido ou expirou.');
    
    // Click fallback recovery button
    await page.click('a:has-text("Solicitar Nova Redefinição")');
    await expect(page).toHaveURL(/\/recuperar-senha/);
  });
});
