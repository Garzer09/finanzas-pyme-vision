import { describe, it, expect } from 'vitest';
import { 
  validateFile, 
  formatFileSize, 
  getFileTypeDescription, 
  detectFinancialDocumentType, 
  estimateProcessingTime,
  getUploadStrategy,
  createFileChunks
} from '../fileValidation';

describe('fileValidation', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('getFileTypeDescription', () => {
    it('should identify Excel files correctly', () => {
      const xlsxFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const xlsFile = new File([''], 'test.xls', { type: 'application/vnd.ms-excel' });
      const csvFile = new File([''], 'test.csv', { type: 'text/csv' });
      const unknownFile = new File([''], 'test.txt', { type: 'text/plain' });

      expect(getFileTypeDescription(xlsxFile)).toBe('Excel (nuevo formato)');
      expect(getFileTypeDescription(xlsFile)).toBe('Excel (formato clásico)');
      expect(getFileTypeDescription(csvFile)).toBe('Archivo CSV');
      expect(getFileTypeDescription(unknownFile)).toBe('Archivo desconocido');
    });
  });

  describe('detectFinancialDocumentType', () => {
    it('should detect financial document types from filename', () => {
      expect(detectFinancialDocumentType('balance_2023.xlsx')).toBe('Balance de Situación');
      expect(detectFinancialDocumentType('PyG_empresa.xlsx')).toBe('Cuenta de Pérdidas y Ganancias');
      expect(detectFinancialDocumentType('flujo_caja.xlsx')).toBe('Flujo de Caja');
      expect(detectFinancialDocumentType('libro_mayor.xlsx')).toBe('Libro Mayor');
      expect(detectFinancialDocumentType('datos_generales.xlsx')).toBeNull();
    });
  });

  describe('estimateProcessingTime', () => {
    it('should estimate processing time based on file size', () => {
      const smallFile = 500 * 1024; // 500KB
      const mediumFile = 5 * 1024 * 1024; // 5MB
      const largeFile = 30 * 1024 * 1024; // 30MB

      expect(estimateProcessingTime(smallFile)).toContain('segundo');
      expect(estimateProcessingTime(mediumFile)).toContain('segundo');
      expect(estimateProcessingTime(largeFile)).toContain('segundo');
    });
  });

  describe('getUploadStrategy', () => {
    it('should recommend direct upload for small files', () => {
      const smallFile = new File(['x'.repeat(1024 * 1024)], 'small.xlsx'); // 1MB
      const strategy = getUploadStrategy(smallFile);
      
      expect(strategy.strategy).toBe('direct');
      expect(strategy.recommendation).toContain('directa');
    });

    it('should recommend chunked upload for large files', () => {
      const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.xlsx'); // 15MB
      const strategy = getUploadStrategy(largeFile);
      
      expect(strategy.strategy).toBe('chunked');
      expect(strategy.chunkCount).toBeGreaterThan(1);
      expect(strategy.recommendation).toContain('partes');
    });
  });

  describe('createFileChunks', () => {
    it('should split large files into chunks', () => {
      const content = 'x'.repeat(15 * 1024 * 1024); // 15MB
      const file = new File([content], 'large.xlsx');
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      
      const chunks = createFileChunks(file, chunkSize);
      
      expect(chunks.length).toBe(3); // 15MB / 5MB = 3 chunks
      expect(chunks[0].size).toBe(chunkSize);
      expect(chunks[2].size).toBe(chunkSize); // Last chunk
      expect(chunks.every(chunk => chunk.name.includes('.chunk'))).toBe(true);
    });

    it('should not split small files', () => {
      const content = 'x'.repeat(1024 * 1024); // 1MB
      const file = new File([content], 'small.xlsx');
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      
      const chunks = createFileChunks(file, chunkSize);
      
      expect(chunks.length).toBe(1);
      expect(chunks[0].size).toBe(file.size);
    });
  });

  describe('validateFile', () => {
    it('should validate file extension', async () => {
      const validFile = new File(['some content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const invalidFile = new File(['some content'], 'test.txt', { type: 'text/plain' });

      const validResult = await validateFile(validFile, { enableContentValidation: false });
      const invalidResult = await validateFile(invalidFile, { enableContentValidation: false });

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('Formato de archivo no compatible');
    });

    it('should reject files that are too large', async () => {
      const largeContent = 'x'.repeat(60 * 1024 * 1024); // 60MB (over limit)
      const largeFile = new File([largeContent], 'large.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const result = await validateFile(largeFile, { enableContentValidation: false });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });

    it('should reject empty files', async () => {
      const emptyFile = new File([''], 'empty.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const result = await validateFile(emptyFile, { enableContentValidation: false });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vacío');
    });

    it('should include chunking information for large files', async () => {
      const content = 'x'.repeat(15 * 1024 * 1024); // 15MB
      const file = new File([content], 'medium.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const result = await validateFile(file, { enableContentValidation: false });

      expect(result.isValid).toBe(true);
      expect(result.fileInfo?.needsChunking).toBe(true);
      expect(result.fileInfo?.estimatedChunks).toBeGreaterThan(1);
    });
  });
});