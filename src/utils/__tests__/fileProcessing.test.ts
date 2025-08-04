import { describe, it, expect } from 'vitest';
import { 
  validateFile, 
  formatFileSize, 
  detectFileType, 
  estimateProcessingTime,
  DEFAULT_PROCESSING_OPTIONS 
} from '../fileProcessing';

describe('fileProcessing utilities', () => {
  describe('validateFile', () => {
    it('should validate file size within limits', () => {
      const file = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.fileSize).toBe(file.size);
      expect(result.fileType).toBe('.xlsx');
    });

    it('should reject files that are too large', () => {
      // Create a mock file that appears large
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 }); // 60MB
      
      const result = validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });

    it('should reject unsupported file formats', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Formato no soportado');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('detectFileType', () => {
    it('should detect Excel files', () => {
      const xlsxFile = new File([''], 'test.xlsx');
      const xlsFile = new File([''], 'test.xls');
      
      expect(detectFileType(xlsxFile)).toBe('excel');
      expect(detectFileType(xlsFile)).toBe('excel');
    });

    it('should detect CSV files', () => {
      const csvFile = new File([''], 'test.csv');
      expect(detectFileType(csvFile)).toBe('csv');
    });

    it('should return unknown for unsupported files', () => {
      const txtFile = new File([''], 'test.txt');
      expect(detectFileType(txtFile)).toBe('unknown');
    });
  });

  describe('estimateProcessingTime', () => {
    it('should provide reasonable time estimates', () => {
      expect(estimateProcessingTime(500 * 1024)).toBe('< 1 minuto'); // 500KB
      expect(estimateProcessingTime(3 * 1024 * 1024)).toBe('1-2 minutos'); // 3MB
      expect(estimateProcessingTime(10 * 1024 * 1024)).toBe('2-5 minutos'); // 10MB
      expect(estimateProcessingTime(25 * 1024 * 1024)).toBe('5-10 minutos'); // 25MB
      expect(estimateProcessingTime(40 * 1024 * 1024)).toBe('10-15 minutos'); // 40MB
    });
  });

  describe('DEFAULT_PROCESSING_OPTIONS', () => {
    it('should have sensible defaults for production use', () => {
      expect(DEFAULT_PROCESSING_OPTIONS.maxFileSize).toBe(50 * 1024 * 1024); // 50MB
      expect(DEFAULT_PROCESSING_OPTIONS.maxRows).toBe(50000); // 50K rows
      expect(DEFAULT_PROCESSING_OPTIONS.allowedFormats).toEqual(['.xlsx', '.xls', '.csv']);
    });
  });
});