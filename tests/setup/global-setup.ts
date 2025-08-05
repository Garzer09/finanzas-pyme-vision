/**
 * Global Test Setup
 * 
 * Comprehensive test environment setup for all test suites
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables for testing
beforeAll(() => {
  // Set up global test environment
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(callback: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock window methods
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  });

  console.log('✅ Global test setup completed');
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  if (typeof global.gc === 'function') {
    global.gc();
  }
});

afterAll(() => {
  console.log('🧹 Global test cleanup completed');
});