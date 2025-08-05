/**
 * Comprehensive Unit Tests for Enhanced File Processor Service
 * 
 * Tests file upload, processing, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedFileProcessor } from '@/services/enhancedFileProcessor';
import { mockSupabaseClient } from '@tests/__mocks__/supabase';
import { 
  mockFileUploadResult, 
  mockProcessingError,
  mockTemplateConfig 
} from '@tests/fixtures/financial-data';

// Mock the template service
vi.mock('@/services/templateService', () => ({
  templateService: {
    detectTemplate: vi.fn(),
    validateData: vi.fn(),
    processWithTemplate: vi.fn(),
  },
}));

describe('Enhanced File Processor Service', () => {
  let fileProcessor: EnhancedFileProcessor;
  let mockFile: File;
  let mockLargeFile: File;
  let mockInvalidFile: File;

  beforeEach(() => {
    fileProcessor = new EnhancedFileProcessor();
    vi.clearAllMocks();
    
    // Create mock files
    mockFile = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    mockLargeFile = new File([new ArrayBuffer(15 * 1024 * 1024)], 'large.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    mockInvalidFile = new File(['invalid content'], 'test.txt', {
      type: 'text/plain',
    });
  });

  describe('File Validation', () => {
    it('should reject missing file', async () => {
      const result = await fileProcessor.processFile(null as any);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('No file provided');
      expect(result.error).toBe('FILE_MISSING');
    });

    it('should reject files that are too large', async () => {
      const result = await fileProcessor.processFile(mockLargeFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('File too large. Maximum size is 10MB.');
      expect(result.error).toBe('FILE_TOO_LARGE');
    });

    it('should accept valid file size', async () => {
      // Mock successful upload
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('files');
      expect(result.success).toBe(true);
    });

    it('should validate file type', async () => {
      // Mock successful upload for valid file type
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const validExcelFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const result = await fileProcessor.processFile(validExcelFile);
      expect(result.success).toBe(true);
    });
  });

  describe('File Upload Process', () => {
    beforeEach(() => {
      // Mock successful upload by default
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'uploads/123-test.xlsx' },
        error: null,
      });
    });

    it('should upload file to correct storage bucket', async () => {
      await fileProcessor.processFile(mockFile);
      
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('files');
      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.stringMatching(/^\d+-test\.xlsx$/),
        mockFile,
        expect.objectContaining({
          cacheControl: '3600',
          upsert: false,
        })
      );
    });

    it('should handle storage upload errors', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Storage error');
      expect(result.error).toBe('STORAGE_ERROR');
    });

    it('should generate unique file names', async () => {
      const file1 = new File(['content'], 'same.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file2 = new File(['content'], 'same.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      await fileProcessor.processFile(file1);
      const upload1Call = mockSupabaseClient.storage.from().upload.mock.calls[0][0];
      
      await fileProcessor.processFile(file2);
      const upload2Call = mockSupabaseClient.storage.from().upload.mock.calls[1][0];
      
      expect(upload1Call).not.toBe(upload2Call);
    });
  });

  describe('Template Detection', () => {
    beforeEach(() => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
    });

    it('should detect template automatically when not provided', async () => {
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockResolvedValue({
        templateId: 'auto-detected-template',
        confidence: 0.95,
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(templateService.detectTemplate).toHaveBeenCalledWith(mockFile);
      expect(result.templateDetection?.templateId).toBe('auto-detected-template');
      expect(result.templateDetection?.confidence).toBe(0.95);
    });

    it('should use provided template when specified', async () => {
      const options = { templateId: 'custom-template' };
      
      const result = await fileProcessor.processFile(mockFile, options);
      
      const { templateService } = await import('@/services/templateService');
      expect(templateService.detectTemplate).not.toHaveBeenCalled();
    });

    it('should handle template detection errors', async () => {
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockRejectedValue(new Error('Template detection failed'));
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Template detection failed');
    });
  });

  describe('Data Processing', () => {
    beforeEach(() => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
    });

    it('should process data with detected template', async () => {
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockResolvedValue({
        templateId: 'balance-sheet-template',
        confidence: 0.95,
      });
      templateService.processWithTemplate.mockResolvedValue({
        processedData: { rows: 10, valid: true },
        errors: [],
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(templateService.processWithTemplate).toHaveBeenCalledWith(
        mockFile,
        'balance-sheet-template'
      );
      expect(result.success).toBe(true);
    });

    it('should handle data processing errors', async () => {
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockResolvedValue({
        templateId: 'test-template',
        confidence: 0.95,
      });
      templateService.processWithTemplate.mockRejectedValue(
        new Error('Invalid data format')
      );
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid data format');
    });

    it('should validate processed data', async () => {
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockResolvedValue({
        templateId: 'test-template',
        confidence: 0.95,
      });
      templateService.processWithTemplate.mockResolvedValue({
        processedData: { rows: 5, valid: true },
        errors: [],
      });
      templateService.validateData.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(templateService.validateData).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should reject invalid processed data', async () => {
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockResolvedValue({
        templateId: 'test-template',
        confidence: 0.95,
      });
      templateService.processWithTemplate.mockResolvedValue({
        processedData: { rows: 0, valid: false },
        errors: ['No valid data found'],
      });
      templateService.validateData.mockResolvedValue({
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation failed');
    });
  });

  describe('Database Storage', () => {
    beforeEach(() => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const { templateService } = import('@/services/templateService');
      templateService.then(service => {
        service.templateService.detectTemplate.mockResolvedValue({
          templateId: 'test-template',
          confidence: 0.95,
        });
        service.templateService.processWithTemplate.mockResolvedValue({
          processedData: { rows: 5, valid: true },
          errors: [],
        });
        service.templateService.validateData.mockResolvedValue({
          isValid: true,
          errors: [],
          warnings: [],
        });
      });
    });

    it('should save file metadata to database', async () => {
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: [{ id: 'file-123' }],
        error: null,
      });
      
      const options = {
        companyId: 'company-123',
        userId: 'user-456',
      };
      
      const result = await fileProcessor.processFile(mockFile, options);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('files');
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'test.xlsx',
          company_id: 'company-123',
          user_id: 'user-456',
          storage_path: 'test-path',
        })
      );
    });

    it('should handle database insertion errors', async () => {
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Database error');
    });
  });

  describe('Options and Configuration', () => {
    it('should use default options when none provided', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      await fileProcessor.processFile(mockFile);
      
      // Should not throw and should process with defaults
      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalled();
    });

    it('should apply provided options', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: [{ id: 'file-123' }],
        error: null,
      });
      
      const options = {
        companyId: 'test-company',
        templateId: 'custom-template',
        userId: 'test-user',
      };
      
      await fileProcessor.processFile(mockFile, options);
      
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'test-company',
          user_id: 'test-user',
        })
      );
    });
  });

  describe('Error Recovery and Cleanup', () => {
    it('should cleanup uploaded file on processing failure', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockRejectedValue(new Error('Processing failed'));
      
      mockSupabaseClient.storage.from().remove.mockResolvedValue({
        data: null,
        error: null,
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(mockSupabaseClient.storage.from().remove).toHaveBeenCalledWith(['test-path']);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockRejectedValue(new Error('Processing failed'));
      
      mockSupabaseClient.storage.from().remove.mockResolvedValue({
        data: null,
        error: { message: 'Cleanup failed' },
      });
      
      const result = await fileProcessor.processFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Processing failed');
      // Should not throw despite cleanup failure
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle concurrent file processing', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const file1 = new File(['content1'], 'file1.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file2 = new File(['content2'], 'file2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const [result1, result2] = await Promise.all([
        fileProcessor.processFile(file1),
        fileProcessor.processFile(file2),
      ]);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should timeout on extremely long processing', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      
      const { templateService } = await import('@/services/templateService');
      templateService.detectTemplate.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 60000)) // Long delay
      );
      
      const startTime = Date.now();
      const result = await fileProcessor.processFile(mockFile);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(55000); // Should timeout before 60s
      expect(result.success).toBe(false);
    }, 10000); // Set test timeout to 10s
  });
});