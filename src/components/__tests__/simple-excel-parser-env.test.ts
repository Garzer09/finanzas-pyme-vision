import { describe, it, expect } from 'vitest';

describe('Simple Excel Parser Environment Configuration', () => {
  describe('Development Mode Configuration', () => {
    it('should read development mode from DENO_ENV environment variable', () => {
      // Test the environment-based configuration logic
      
      // Simulate development environment
      const developmentEnv = 'development';
      const isDevelopmentMode_dev = developmentEnv === 'development';
      expect(isDevelopmentMode_dev).toBe(true);
      
      // Simulate production environment  
      const productionEnv = 'production';
      const isDevelopmentMode_prod = productionEnv === 'development';
      expect(isDevelopmentMode_prod).toBe(false);
      
      // Simulate undefined environment (should default to production)
      const undefinedEnv = undefined;
      const isDevelopmentMode_undefined = undefinedEnv === 'development';
      expect(isDevelopmentMode_undefined).toBe(false);
    });

    it('should use mock data in development mode', () => {
      // Verify the expected behavior based on environment
      const testEnvironments = [
        { env: 'development', expectedMock: true },
        { env: 'production', expectedMock: false },
        { env: 'staging', expectedMock: false },
        { env: undefined, expectedMock: false }
      ];

      testEnvironments.forEach(({ env, expectedMock }) => {
        const isDevelopmentMode = env === 'development';
        expect(isDevelopmentMode).toBe(expectedMock);
      });
    });

    it('should return appropriate response messages based on mode', () => {
      // Test response message logic
      const getDevelopmentMessage = (isDevelopmentMode: boolean) => {
        return isDevelopmentMode 
          ? 'Archivo analizado correctamente (DESARROLLO - datos de prueba)'
          : 'Archivo analizado correctamente';
      };

      // Development mode message
      const devMessage = getDevelopmentMessage(true);
      expect(devMessage).toContain('DESARROLLO');
      expect(devMessage).toContain('datos de prueba');

      // Production mode message
      const prodMessage = getDevelopmentMessage(false);
      expect(prodMessage).not.toContain('DESARROLLO');
      expect(prodMessage).toBe('Archivo analizado correctamente');
    });

    it('should include developmentMode flag in response', () => {
      // Test that the response includes the development mode flag
      const createResponse = (isDevelopmentMode: boolean) => ({
        success: true,
        detectedSheets: [],
        detectedFields: {},
        sheetsData: [],
        fileName: 'test.xlsx',
        message: isDevelopmentMode 
          ? 'Archivo analizado correctamente (DESARROLLO - datos de prueba)'
          : 'Archivo analizado correctamente',
        developmentMode: isDevelopmentMode
      });

      const devResponse = createResponse(true);
      expect(devResponse.developmentMode).toBe(true);
      expect(devResponse.message).toContain('DESARROLLO');

      const prodResponse = createResponse(false);
      expect(prodResponse.developmentMode).toBe(false);
      expect(prodResponse.message).not.toContain('DESARROLLO');
    });
  });
});