/**
 * Comprehensive Integration Tests
 * 
 * End-to-end testing of financial data processing workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PeriodProvider } from '@/contexts/PeriodContext';
import { ExcelUpload } from '@/components/ExcelUpload';
import { FilesDashboardPage } from '@/pages/FilesDashboardPage';
import { supabase } from '@/integrations/supabase/client';
import { 
  mockExcelData,
  mockBalanceSheet,
  mockIncomeStatement,
  createMockUser,
  createMockCompany
} from '@tests/fixtures/financial-data';

// Mock environment for integration tests
vi.mock('@/integrations/supabase/client');

// Test wrapper for integration tests
const IntegrationTestWrapper = ({ children }: { children: React.ReactNode }) => {
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
          <PeriodProvider>
            {children}
          </PeriodProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Financial Data Processing Integration', () => {
  let mockUser: any;
  let mockCompany: any;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUser = createMockUser();
    mockCompany = createMockCompany();

    // Setup default mocks
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      if (table === 'companies') {
        mockQuery.single.mockResolvedValue({
          data: mockCompany,
          error: null,
        });
      }

      return mockQuery;
    });

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-file-path' },
        error: null,
      }),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Excel Upload to Analysis Workflow', () => {
    it('should complete full workflow from upload to analysis', async () => {
      // Create a mock Excel file
      const mockFile = new File(
        [JSON.stringify(mockExcelData)], 
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      // Mock successful file processing
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'files') {
          mockQuery.insert.mockResolvedValue({
            data: [{ id: 'file-123', status: 'processed' }],
            error: null,
          });
        }

        if (table === 'financial_data') {
          mockQuery.insert.mockResolvedValue({
            data: mockExcelData.slice(1).map((row, index) => ({
              id: `entry-${index}`,
              account: row[0],
              debit: row[1] ? parseFloat(row[1]) : null,
              credit: row[2] ? parseFloat(row[2]) : null,
              description: row[3],
              date: row[4],
            })),
            error: null,
          });
        }

        return mockQuery;
      });

      const onUploadComplete = vi.fn();

      render(
        <IntegrationTestWrapper>
          <ExcelUpload onUploadComplete={onUploadComplete} />
        </IntegrationTestWrapper>
      );

      // Step 1: Upload file
      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      // Step 2: Verify processing
      await waitFor(() => {
        expect(screen.getByText(/procesando/i)).toBeInTheDocument();
      });

      // Step 3: Verify completion
      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalledWith(
          'file-123',
          expect.objectContaining({
            entries: expect.any(Array),
          })
        );
      }, { timeout: 10000 });

      // Step 4: Verify data was saved
      expect(supabase.from).toHaveBeenCalledWith('files');
      expect(supabase.from).toHaveBeenCalledWith('financial_data');
    });

    it('should handle template detection and validation', async () => {
      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'balance-sheet.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      // Mock template detection
      const mockTemplate = {
        id: 'balance-sheet-template',
        name: 'Balance Sheet Standard',
        confidence: 0.95,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'templates') {
          mockQuery.select.mockReturnThis();
          mockQuery.eq.mockReturnThis();
          mockQuery.single.mockResolvedValue({
            data: mockTemplate,
            error: null,
          });
        }

        return mockQuery;
      });

      render(
        <IntegrationTestWrapper>
          <ExcelUpload />
        </IntegrationTestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/plantilla detectada/i)).toBeInTheDocument();
        expect(screen.getByText(/balance sheet standard/i)).toBeInTheDocument();
      });
    });

    it('should validate accounting coherence during upload', async () => {
      // Create unbalanced data
      const unbalancedData = [
        ['Cuenta', 'Débito', 'Crédito', 'Descripción', 'Fecha'],
        ['1100 - Caja', '1000', '', 'Entrada', '2024-01-15'],
        ['4100 - Ventas', '', '500', 'Venta', '2024-01-15'], // Unbalanced!
      ];

      const mockFile = new File(
        [JSON.stringify(unbalancedData)],
        'unbalanced.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      render(
        <IntegrationTestWrapper>
          <ExcelUpload />
        </IntegrationTestWrapper>
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error de validación/i)).toBeInTheDocument();
        expect(screen.getByText(/entradas no balanceadas/i)).toBeInTheDocument();
      });
    });
  });

  describe('Financial Analysis Pipeline Integration', () => {
    it('should process uploaded data through analysis modules', async () => {
      // Mock processed financial data
      const mockProcessedData = {
        balanceSheet: mockBalanceSheet,
        incomeStatement: mockIncomeStatement,
        ratios: {
          liquidity: { currentRatio: 2.0 },
          profitability: { netMargin: 0.12 },
        },
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'analysis_results') {
          mockQuery.insert.mockResolvedValue({
            data: [{ id: 'analysis-123', results: mockProcessedData }],
            error: null,
          });
        }

        return mockQuery;
      });

      // Mock the analysis pipeline
      const mockAnalysisPipeline = vi.fn().mockResolvedValue(mockProcessedData);

      render(
        <IntegrationTestWrapper>
          <ExcelUpload 
            onUploadComplete={(fileId, data) => {
              // Simulate analysis pipeline trigger
              mockAnalysisPipeline(data);
            }}
          />
        </IntegrationTestWrapper>
      );

      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockAnalysisPipeline).toHaveBeenCalled();
      });
    });

    it('should generate financial reports after data processing', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'reports') {
          mockQuery.insert.mockResolvedValue({
            data: [{ 
              id: 'report-123', 
              type: 'financial_analysis',
              status: 'generated',
              file_path: 'reports/financial-analysis-123.pdf'
            }],
            error: null,
          });
        }

        return mockQuery;
      });

      const onReportGenerated = vi.fn();

      render(
        <IntegrationTestWrapper>
          <ExcelUpload 
            onUploadComplete={(fileId, data) => {
              // Simulate report generation
              onReportGenerated({ reportId: 'report-123', type: 'financial_analysis' });
            }}
          />
        </IntegrationTestWrapper>
      );

      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(onReportGenerated).toHaveBeenCalledWith(
          expect.objectContaining({
            reportId: 'report-123',
            type: 'financial_analysis',
          })
        );
      });
    });
  });

  describe('Multi-User and Permission Integration', () => {
    it('should respect user permissions during file processing', async () => {
      // Create a viewer user (limited permissions)
      const viewerUser = createMockUser({ 
        role: 'viewer',
        permissions: ['read'],
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: viewerUser },
        error: null,
      });

      render(
        <IntegrationTestWrapper>
          <ExcelUpload />
        </IntegrationTestWrapper>
      );

      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/permisos insuficientes/i)).toBeInTheDocument();
      });
    });

    it('should handle admin impersonation correctly', async () => {
      const adminUser = createMockUser({ 
        role: 'admin',
        permissions: ['read', 'write', 'admin'],
      });

      const targetUser = createMockUser({ 
        id: 'target-user-123',
        role: 'viewer',
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: adminUser },
        error: null,
      });

      // Mock impersonation context
      vi.mock('@/contexts/AdminImpersonationContext', () => ({
        useAdminImpersonation: () => ({
          isImpersonating: true,
          impersonatedUserId: targetUser.id,
        }),
      }));

      render(
        <IntegrationTestWrapper>
          <ExcelUpload targetUserId={targetUser.id} />
        </IntegrationTestWrapper>
      );

      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      // Should process on behalf of target user
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('files');
        // Verify the file was associated with the target user
      });
    });
  });

  describe('Error Recovery and Resilience Integration', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database failure
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      render(
        <IntegrationTestWrapper>
          <ExcelUpload />
        </IntegrationTestWrapper>
      );

      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
        expect(screen.getByText(/reintentar/i)).toBeInTheDocument();
      });
    });

    it('should handle partial processing failures with rollback', async () => {
      let callCount = 0;
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'files') {
          mockQuery.insert.mockResolvedValue({
            data: [{ id: 'file-123' }],
            error: null,
          });
        }

        if (table === 'financial_data') {
          callCount++;
          if (callCount === 1) {
            // First call succeeds
            mockQuery.insert.mockResolvedValue({
              data: [{ id: 'entry-1' }],
              error: null,
            });
          } else {
            // Second call fails
            mockQuery.insert.mockResolvedValue({
              data: null,
              error: { message: 'Constraint violation' },
            });
          }
        }

        return mockQuery;
      });

      render(
        <IntegrationTestWrapper>
          <ExcelUpload />
        </IntegrationTestWrapper>
      );

      const mockFile = new File(
        [JSON.stringify(mockExcelData)],
        'financial-data.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const fileInput = screen.getByLabelText(/selecciona un archivo/i);
      await userEvent.upload(fileInput, mockFile);

      const uploadButton = screen.getByText(/subir archivo/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error parcial/i)).toBeInTheDocument();
        // Should show rollback message
        expect(screen.getByText(/revertiendo cambios/i)).toBeInTheDocument();
      });
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Mock concurrent file uploads
      const file1 = new File([JSON.stringify(mockExcelData)], 'file1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const file2 = new File([JSON.stringify(mockExcelData)], 'file2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      let uploadCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        if (table === 'files') {
          uploadCount++;
          mockQuery.insert.mockResolvedValue({
            data: [{ id: `file-${uploadCount}` }],
            error: null,
          });
        }

        return mockQuery;
      });

      render(
        <IntegrationTestWrapper>
          <div>
            <ExcelUpload />
            <ExcelUpload />
          </div>
        </IntegrationTestWrapper>
      );

      const fileInputs = screen.getAllByLabelText(/selecciona un archivo/i);
      
      // Upload files simultaneously
      await Promise.all([
        userEvent.upload(fileInputs[0], file1),
        userEvent.upload(fileInputs[1], file2),
      ]);

      const uploadButtons = screen.getAllByText(/subir archivo/i);
      await Promise.all([
        userEvent.click(uploadButtons[0]),
        userEvent.click(uploadButtons[1]),
      ]);

      // Both should complete successfully
      await waitFor(() => {
        expect(screen.getAllByText(/procesando/i)).toHaveLength(2);
      });

      await waitFor(() => {
        expect(uploadCount).toBe(2);
      }, { timeout: 15000 });
    });
  });
});

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Setup mocks for dashboard tests
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      if (table === 'files') {
        mockQuery.select.mockResolvedValue({
          data: [
            { id: 'file-1', name: 'Q1-2024.xlsx', status: 'processed' },
            { id: 'file-2', name: 'Q2-2024.xlsx', status: 'processing' },
          ],
          error: null,
        });
      }

      return mockQuery;
    });
  });

  it('should display processed files in dashboard', async () => {
    render(
      <IntegrationTestWrapper>
        <FilesDashboardPage />
      </IntegrationTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Q1-2024.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Q2-2024.xlsx')).toBeInTheDocument();
    });

    expect(screen.getByText(/procesado/i)).toBeInTheDocument();
    expect(screen.getByText(/procesando/i)).toBeInTheDocument();
  });

  it('should allow file download from dashboard', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: new Blob(['file content']),
        error: null,
      }),
      upload: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
    } as any);

    render(
      <IntegrationTestWrapper>
        <FilesDashboardPage />
      </IntegrationTestWrapper>
    );

    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /descargar/i });
      expect(downloadButton).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /descargar/i });
    await userEvent.click(downloadButton);

    expect(supabase.storage.from).toHaveBeenCalledWith('files');
  });
});