import { User, Session } from '@supabase/supabase-js';

/**
 * Unified authentication state machine
 * This replaces the complex multiple states (authStatus, roleStatus, hasJustLoggedIn, initialized)
 * with a single, clear state that represents all possible authentication scenarios.
 */
export type AuthState = 
  | { status: 'initializing' }
  | { status: 'unauthenticated' }
  | { status: 'authenticating' }
  | { status: 'resolving-role', user: User, session: Session, role: Role }
  | { status: 'authenticated', user: User, session: Session, role: Role }
  | { status: 'error', error: string, retry: () => void };

/**
 * User roles in the system
 */
export type Role = 'admin' | 'viewer' | 'none';

/**
 * Authentication events that can trigger state transitions
 */
export type AuthEvent = 
  | { type: 'SIGN_IN_START' }
  | { type: 'SIGN_IN_SUCCESS', user: User, session: Session, role: Role }
  | { type: 'SIGN_IN_ERROR', error: string }
  | { type: 'SIGN_OUT' }
  | { type: 'SESSION_RECOVERED', user: User, session: Session, role: Role }
  | { type: 'ROLE_RESOLVED', role: Role }
  | { type: 'NETWORK_ERROR', error: string }
  | { type: 'RETRY' }
  | { type: 'INACTIVITY_WARNING' }
  | { type: 'INACTIVITY_TIMEOUT' };

/**
 * State transition function type
 */
export type StateTransition = (state: AuthState, event: AuthEvent) => AuthState;

/**
 * Auth context interface with simplified API
 */
export interface AuthContextType {
  // Current state
  authState: AuthState;
  
  // Computed getters for backward compatibility
  user: User | null;
  session: Session | null;
  authStatus: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  role: Role;
  roleStatus: 'idle' | 'resolving' | 'ready' | 'error';
  initialized: boolean;
  hasJustLoggedIn: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data?: any) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshRole: () => Promise<void>;
  
  // Inactivity management
  inactivityWarning: boolean;
  timeUntilLogout: number | null;
  resetInactivityTimer: () => void;
}

/**
 * Inactivity detection configuration
 */
export interface InactivityConfig {
  timeoutMs: number; // 30 minutes default
  warningMs: number; // 5 minutes before timeout
  events: string[]; // Events to track for activity
}

/**
 * Default inactivity configuration
 */
export const DEFAULT_INACTIVITY_CONFIG: InactivityConfig = {
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  warningMs: 5 * 60 * 1000,  // 5 minutes warning
  events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
};

/**
 * Retry configuration for network operations
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
};

/**
 * Helper function to check if user should be navigated after authentication
 * Replaces the complex logic that depended on hasJustLoggedIn
 */
export function shouldNavigateAfterAuth(authState: AuthState, currentPath: string): string | null {
  if (authState.status !== 'authenticated') {
    return null;
  }
  
  // Don't navigate if already on a protected route
  if (currentPath.startsWith('/app/') || currentPath.startsWith('/admin/')) {
    return null;
  }
  
  // Navigate based on role
  const targetPath = authState.role === 'admin' ? '/admin/empresas' : '/app/mis-empresas';
  
  // Only navigate if not already on auth page or if role is resolved
  if (currentPath === '/auth' && authState.role !== 'none') {
    return targetPath;
  }
  
  return null;
}

/**
 * Helper function to determine if auth state allows access to protected routes
 */
export function canAccessProtectedRoute(authState: AuthState): boolean {
  return authState.status === 'authenticated';
}

/**
 * Helper function to determine if auth state is in a loading state
 */
export function isAuthLoading(authState: AuthState): boolean {
  return authState.status === 'initializing' || 
         authState.status === 'authenticating' || 
         authState.status === 'resolving-role';
}

/**
 * Helper function to get error message from auth state
 */
export function getAuthError(authState: AuthState): string | null {
  return authState.status === 'error' ? authState.error : null;
}

/**
 * Helper function to get retry function from auth state
 */
export function getAuthRetry(authState: AuthState): (() => void) | null {
  return authState.status === 'error' ? authState.retry : null;
}