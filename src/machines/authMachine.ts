import { createMachine, assign } from 'xstate';
import { User, Session } from '@supabase/supabase-js';
import { Role } from '@/types/auth';

export interface AuthContext {
  user: User | null;
  session: Session | null;
  role: Role;
  error: string | null;
  hasJustLoggedIn: boolean;
}

export type AuthEvent =
  | { type: 'SIGN_IN'; email: string; password: string }
  | { type: 'SIGN_IN_SUCCESS'; user: User; session: Session }
  | { type: 'SIGN_IN_ERROR'; error: string }
  | { type: 'ROLE_UPDATED'; role: Role }
  | { type: 'ROLE_ERROR'; error: string }
  | { type: 'SESSION_RECOVERED'; user: User; session: Session }
  | { type: 'SIGN_OUT' }
  | { type: 'RETRY' };

export const authMachine = createMachine<AuthContext, AuthEvent>({
  id: 'auth',
  initial: 'initializing',
  context: {
    user: null,
    session: null,
    role: 'none',
    error: null,
    hasJustLoggedIn: false,
  },
  states: {
    initializing: {
      on: {
        SESSION_RECOVERED: {
          target: 'authenticated',
          actions: assign({
            user: ({ event }) => event.user,
            session: ({ event }) => event.session,
            hasJustLoggedIn: false,
            error: null,
          }),
        },
        SIGN_OUT: {
          target: 'unauthenticated',
          actions: assign({
            user: null,
            session: null,
            role: 'none',
            hasJustLoggedIn: false,
            error: null,
          }),
        },
      },
    },
    unauthenticated: {
      on: {
        SIGN_IN: {
          target: 'authenticating',
          actions: assign({
            error: null,
          }),
        },
      },
    },
    authenticating: {
      on: {
        SIGN_IN_SUCCESS: {
          target: 'authenticated',
          actions: assign({
            user: ({ event }) => event.user,
            session: ({ event }) => event.session,
            hasJustLoggedIn: true,
            error: null,
          }),
        },
        SIGN_IN_ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error,
            hasJustLoggedIn: false,
          }),
        },
      },
    },
    authenticated: {
      on: {
        ROLE_UPDATED: {
          actions: assign({
            role: ({ event }) => event.role,
          }),
        },
        ROLE_ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
        SIGN_OUT: {
          target: 'unauthenticated',
          actions: assign({
            user: null,
            session: null,
            role: 'none',
            hasJustLoggedIn: false,
            error: null,
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'unauthenticated',
          actions: assign({
            error: null,
          }),
        },
        SIGN_OUT: {
          target: 'unauthenticated',
          actions: assign({
            user: null,
            session: null,
            role: 'none',
            hasJustLoggedIn: false,
            error: null,
          }),
        },
      },
    },
  },
});