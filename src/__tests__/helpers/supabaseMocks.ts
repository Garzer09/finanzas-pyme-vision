import { vi } from 'vitest';

/**
 * Generic Supabase Mock Helper
 * Provides consistent mock structure that replicates supabase.from().select().eq() chain methods
 */

// Base mock procedure that returns { data, error } structure
const createMockProcedure = (data: any = null, error: any = null) => 
  vi.fn().mockResolvedValue({ data, error });

// Chain method that can be extended
const createChainMethods = (finalData: any = null, finalError: any = null) => ({
  eq: vi.fn(() => ({
    maybeSingle: createMockProcedure(finalData, finalError),
    single: createMockProcedure(finalData, finalError)
  })),
  insert: vi.fn(() => ({
    select: createMockProcedure(finalData, finalError)
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => createMockProcedure(finalData, finalError))
  })),
  delete: vi.fn(() => ({
    eq: vi.fn(() => createMockProcedure(finalData, finalError))
  }))
});

// Main table mock that returns chain methods
const createTableMock = (data: any = null, error: any = null) => ({
  select: vi.fn(() => createChainMethods(data, error)),
  insert: vi.fn(() => ({
    select: createMockProcedure(data, error)
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => createMockProcedure(data, error))
  })),
  delete: vi.fn(() => ({
    eq: vi.fn(() => createMockProcedure(data, error))
  })),
  upsert: vi.fn(() => ({
    select: createMockProcedure(data, error)
  }))
});

// Complete Supabase mock
export const createSupabaseMock = (defaultData: any = null, defaultError: any = null) => ({
  from: vi.fn((table: string) => createTableMock(defaultData, defaultError)),
  rpc: vi.fn().mockResolvedValue({ data: defaultData, error: defaultError }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } }, 
      error: null 
    }),
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: { access_token: 'test-token' } }, 
      error: null 
    }),
    onAuthStateChange: vi.fn(() => ({ 
      data: { subscription: { unsubscribe: vi.fn() } } 
    }))
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ 
      data: { success: true }, 
      error: null 
    })
  }
});

// Default mock instance
export const mockSupabase = createSupabaseMock();

// Mock with specific return values
export const mockSupabaseWithData = (data: any, error: any = null) => 
  createSupabaseMock(data, error);

// Mock for auth operations
export const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ 
    data: { user: { id: 'test-user-id', email: 'test@test.com' } }, 
    error: null 
  }),
  signInWithPassword: vi.fn().mockResolvedValue({ 
    data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } }, 
    error: null 
  })
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
};