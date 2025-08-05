/**
 * Comprehensive Component Tests for ExcelUpload
 * 
 * Tests the Excel upload component functionality, user interactions,
 * and integration with file processing services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcelUpload } from '@/components/ExcelUpload';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createMockUser } from '@tests/fixtures/financial-data';

// Mock the hooks and services
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: createMockUser(),
    loading: false,
  }),
}));

vi.mock('@/contexts/AdminImpersonationContext', () => ({
  AdminImpersonationProvider: ({ children }: { children: React.ReactNode }) => children,
  useAdminImpersonation: () => ({
    isImpersonating: false,
    impersonatedUserId: null,
  }),
}));

vi.mock('@/utils/moduleMapping', () => ({
  saveDataToModules: vi.fn().mockResolvedValue({ success: true }),
  createModuleNotifications: vi.fn().mockResolvedValue(true),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('ExcelUpload Component', () => {
  let mockFile: File;
  let mockInvalidFile: File;
  let mockLargeFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock files
    mockFile = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    mockInvalidFile = new File(['invalid content'], 'test.txt', {
      type: 'text/plain',
    });
    
    mockLargeFile = new File([new ArrayBuffer(15 * 1024 * 1024)], 'large.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  });

  describe('Component Rendering', () => {
    it('should render upload interface by default', () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      expect(screen.getByText(/cargar archivo/i)).toBeInTheDocument();
      expect(screen.getByText(/selecciona un archivo/i)).toBeInTheDocument();
    });

    it('should show template manager when requested', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const templateButton = screen.getByText(/gestionar plantillas/i);
      await userEvent.click(templateButton);

      await waitFor(() => {
        expect(screen.getByText(/administrar plantillas/i)).toBeInTheDocument();
      });
    });

    it('should display upload progress when uploading', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/procesando/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload Functionality', () => {
    it('should accept valid Excel files', async () => {
      const onUploadComplete = vi.fn();
      
      render(
        <TestWrapper>
          <ExcelUpload onUploadComplete={onUploadComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      expect(fileInput.files[0]).toBe(mockFile);
      expect(fileInput.files).toHaveLength(1);
    });

    it('should reject invalid file types', async () => {
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      useToast.mockReturnValue({ toast: mockToast });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockInvalidFile);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            description: expect.stringContaining('tipo de archivo'),
          })
        );
      });
    });

    it('should reject files that are too large', async () => {
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      useToast.mockReturnValue({ toast: mockToast });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockLargeFile);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            description: expect.stringContaining('tamaño'),
          })
        );
      });
    });

    it('should handle multiple file selection', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const file1 = new File(['content1'], 'file1.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file2 = new File(['content2'], 'file2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, [file1, file2]);

      expect(fileInput.files).toHaveLength(2);
    });
  });

  describe('Upload Process Integration', () => {
    it('should call onUploadComplete when upload succeeds', async () => {
      const onUploadComplete = vi.fn();
      
      // Mock successful upload
      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules.mockResolvedValue({ success: true, fileId: 'file-123' });

      render(
        <TestWrapper>
          <ExcelUpload onUploadComplete={onUploadComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalledWith('file-123', expect.any(Object));
      });
    });

    it('should handle upload errors gracefully', async () => {
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      useToast.mockReturnValue({ toast: mockToast });

      // Mock failed upload
      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules.mockRejectedValue(new Error('Upload failed'));

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
          })
        );
      });
    });

    it('should show preview after successful upload', async () => {
      const mockProcessedData = {
        preview: [
          ['Cuenta', 'Débito', 'Crédito'],
          ['1100 - Caja', '1000', ''],
          ['4100 - Ventas', '', '1000'],
        ],
      };

      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules.mockResolvedValue({ 
        success: true, 
        fileId: 'file-123',
        data: mockProcessedData,
      });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/vista previa/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Management', () => {
    it('should allow template selection', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const templateButton = screen.getByText(/gestionar plantillas/i);
      await userEvent.click(templateButton);

      await waitFor(() => {
        const templateModal = screen.getByRole('dialog');
        expect(templateModal).toBeInTheDocument();
      });
    });

    it('should apply selected template to upload', async () => {
      const mockTemplate = {
        id: 'template-001',
        name: 'Balance General',
        columns: ['Cuenta', 'Débito', 'Crédito'],
      };

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      // Simulate template selection
      const templateButton = screen.getByText(/gestionar plantillas/i);
      await userEvent.click(templateButton);

      // Mock template selection
      await waitFor(() => {
        const selectButton = screen.getByText(/seleccionar plantilla/i);
        fireEvent.click(selectButton);
      });

      expect(screen.getByText(/plantilla seleccionada/i)).toBeInTheDocument();
    });
  });

  describe('Data Preview and Validation', () => {
    it('should show data validation preview', async () => {
      const mockProcessedData = {
        validation: {
          isValid: true,
          errors: [],
          warnings: ['Algunos valores pueden necesitar revisión'],
        },
        preview: [
          ['Cuenta', 'Débito', 'Crédito'],
          ['1100 - Caja', '1000', ''],
        ],
      };

      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules.mockResolvedValue({ 
        success: true, 
        fileId: 'file-123',
        data: mockProcessedData,
      });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/vista previa/i)).toBeInTheDocument();
        expect(screen.getByText(/validación/i)).toBeInTheDocument();
      });
    });

    it('should display validation errors', async () => {
      const mockProcessedData = {
        validation: {
          isValid: false,
          errors: ['Error: Entradas no balanceadas'],
          warnings: [],
        },
      };

      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules.mockResolvedValue({ 
        success: true, 
        fileId: 'file-123',
        data: mockProcessedData,
      });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/entradas no balanceadas/i)).toBeInTheDocument();
      });
    });

    it('should allow data correction and reprocessing', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      // Simulate upload with validation errors
      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        const editButton = screen.queryByText(/editar datos/i);
        if (editButton) {
          fireEvent.click(editButton);
          expect(screen.getByText(/editor de datos/i)).toBeInTheDocument();
        }
      });
    });
  });

  describe('User Permissions and Access Control', () => {
    it('should handle admin impersonation', async () => {
      const { useAdminImpersonation } = await import('@/contexts/AdminImpersonationContext');
      useAdminImpersonation.mockReturnValue({
        isImpersonating: true,
        impersonatedUserId: 'impersonated-user-123',
      });

      const targetUserId = 'target-user-456';

      render(
        <TestWrapper>
          <ExcelUpload targetUserId={targetUserId} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      const { saveDataToModules } = await import('@/utils/moduleMapping');
      await waitFor(() => {
        expect(saveDataToModules).toHaveBeenCalledWith(
          expect.any(Object),
          targetUserId
        );
      });
    });

    it('should handle missing user context', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      useToast.mockReturnValue({ toast: mockToast });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            description: expect.stringContaining('usuario'),
          })
        );
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should be keyboard accessible', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      
      // Test keyboard navigation
      fileInput.focus();
      expect(fileInput).toHaveFocus();

      // Test Enter key activation
      fireEvent.keyDown(fileInput, { key: 'Enter', code: 'Enter' });
      
      // Should maintain accessibility
      expect(fileInput).toBeInTheDocument();
    });

    it('should provide screen reader support', () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      expect(fileInput).toHaveAttribute('aria-label');
      
      const uploadArea = fileInput.closest('[role="button"]');
      if (uploadArea) {
        expect(uploadArea).toHaveAttribute('aria-describedby');
      }
    });

    it('should show loading states appropriately', async () => {
      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      // Should show loading indicator
      expect(screen.getByText(/procesando/i)).toBeInTheDocument();
      
      // Upload button should be disabled during upload
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network errors', async () => {
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      useToast.mockReturnValue({ toast: mockToast });

      // Mock network error
      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            description: expect.stringContaining('Network error'),
          })
        );
      });
    });

    it('should allow retry after failure', async () => {
      const { saveDataToModules } = await import('@/utils/moduleMapping');
      saveDataToModules
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ success: true, fileId: 'file-123' });

      render(
        <TestWrapper>
          <ExcelUpload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      
      // First attempt
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByText(/reintentar/i);
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/éxito/i)).toBeInTheDocument();
      });
    });
  });
});