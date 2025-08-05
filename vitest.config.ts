import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest Configuration for Finanzas PYME Vision
 * 
 * Optimized configuration for unit and integration testing
 * with comprehensive coverage reporting and TypeScript support.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // Global test configuration
    globals: true,
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Test patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{git,next}/**',
      '**/e2e/**'
    ],
    
    // Coverage configuration with v8 provider
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds for production readiness
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      
      // Files to include/exclude from coverage
      include: [
        'src/**/*.{js,ts,jsx,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts'
      ],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/types/**',
        '**/mocks/**'
      ],
      
      // Advanced coverage options
      all: true,
      clean: true,
      cleanOnRerun: true
    },
    
    // Test execution options
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    // Performance optimizations
    isolate: true,
    passWithNoTests: true,
    
    // Reporter configuration - simplified to avoid missing UI dependencies
    reporter: ['verbose'],
    
    // Mock and stub configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: false,
    
    // Debugging options (can be enabled for development)
    logHeapUsage: false,
    
    // Security and stability options
    sequence: {
      hooks: 'parallel',
      setupFiles: 'list'
    },
    
    // Enable threads for better performance
    threads: true,
    maxThreads: 4,
    minThreads: 1
  }
});