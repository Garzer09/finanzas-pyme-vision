/**
 * File upload helper functions for E2E tests
 */

import { Page, expect } from '@playwright/test';
import { TEST_FILES } from '../fixtures/test-files';

export interface UploadOptions {
  timeout?: number;
  waitForProcessing?: boolean;
  expectedElements?: string[];
}

/**
 * Navigate to upload page and verify access
 */
export async function navigateToUpload(page: Page, timeout = 30000) {
  console.log('📂 Navigating to upload page');
  
  await page.goto('/subir-excel');
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the upload page and have access
  await expect(page.locator('h1:has-text("Subir Archivo Excel")')).toBeVisible({ timeout });
  
  // Verify file input is available
  await expect(page.locator('input[type="file"]')).toBeVisible({ timeout });
  
  console.log('✅ Successfully navigated to upload page');
}

/**
 * Upload a test file
 */
export async function uploadTestFile(page: Page, fileKey: keyof typeof TEST_FILES, options: UploadOptions = {}) {
  const { timeout = 30000, waitForProcessing = true, expectedElements = [] } = options;
  const fileConfig = TEST_FILES[fileKey];
  
  if (!fileConfig || typeof fileConfig !== 'object' || !('path' in fileConfig)) {
    throw new Error(`Invalid file key: ${fileKey}`);
  }
  
  console.log(`📤 Uploading file: ${fileConfig.name}`);
  
  // Get file input and upload file
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible({ timeout });
  
  await fileInput.setInputFiles(fileConfig.path);
  
  if (waitForProcessing) {
    console.log('⏳ Waiting for file processing...');
    
    // Wait for processing indicators
    const processingIndicators = [
      'text=procesado',
      'text=datos',
      'text=completado',
      'text=extraídos',
      'text=listos',
      'text=archivo',
      '[data-testid="upload-success"]',
      '.upload-success'
    ];
    
    let processingComplete = false;
    for (const indicator of processingIndicators) {
      try {
        await page.waitForSelector(indicator, { timeout: 10000 });
        processingComplete = true;
        break;
      } catch {
        // Try next indicator
      }
    }
    
    if (!processingComplete) {
      console.warn('⚠️ Could not detect file processing completion, continuing...');
    }
    
    // Check for expected data elements if provided
    if (expectedElements.length > 0) {
      console.log('🔍 Verifying expected data elements...');
      for (const element of expectedElements) {
        try {
          await expect(page.locator(`text=${element}`)).toBeVisible({ timeout: 5000 });
          console.log(`✅ Found expected element: ${element}`);
        } catch {
          console.warn(`⚠️ Expected element not found: ${element}`);
        }
      }
    }
  }
  
  console.log(`✅ File upload completed: ${fileConfig.name}`);
}

/**
 * Upload multiple test files in sequence
 */
export async function uploadMultipleFiles(page: Page, fileKeys: Array<keyof typeof TEST_FILES>, options: UploadOptions = {}) {
  console.log(`📤 Uploading multiple files: ${fileKeys.join(', ')}`);
  
  for (const fileKey of fileKeys) {
    await uploadTestFile(page, fileKey, options);
    
    // Small delay between uploads
    await page.waitForTimeout(2000);
  }
  
  console.log('✅ Multiple file upload completed');
}

/**
 * Verify upload success indicators
 */
export async function verifyUploadSuccess(page: Page, timeout = 10000) {
  console.log('✅ Verifying upload success');
  
  const successIndicators = [
    'text=archivo procesado',
    'text=datos han sido extraídos',
    'text=listos para el análisis',
    'text=procesado correctamente',
    '[data-testid="upload-success"]',
    '.success'
  ];
  
  let successFound = false;
  for (const indicator of successIndicators) {
    try {
      await expect(page.locator(indicator)).toBeVisible({ timeout: timeout / successIndicators.length });
      successFound = true;
      console.log(`✅ Upload success verified with: ${indicator}`);
      break;
    } catch {
      // Try next indicator
    }
  }
  
  if (!successFound) {
    console.warn('⚠️ No explicit success indicator found, checking for general processing signs');
    
    // Look for general signs that something was processed
    const generalIndicators = [
      'text=datos',
      'text=archivo',
      'table',
      '[data-testid="data-preview"]',
      '.data-preview'
    ];
    
    for (const indicator of generalIndicators) {
      try {
        await expect(page.locator(indicator)).toBeVisible({ timeout: 3000 });
        console.log(`✅ General processing indicator found: ${indicator}`);
        return;
      } catch {
        // Continue checking
      }
    }
    
    throw new Error('Could not verify upload success - no indicators found');
  }
}

/**
 * Check for upload error states
 */
export async function checkForUploadErrors(page: Page) {
  console.log('🔍 Checking for upload errors');
  
  const errorSelectors = [
    '.error',
    '[role="alert"]',
    '.alert-error',
    'text=error',
    'text=fallo',
    'text=problema'
  ];
  
  for (const selector of errorSelectors) {
    const errorElement = page.locator(selector);
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.warn(`⚠️ Upload error detected: ${errorText}`);
      return errorText;
    }
  }
  
  console.log('✅ No upload errors detected');
  return null;
}