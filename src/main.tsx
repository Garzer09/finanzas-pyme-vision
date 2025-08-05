
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import * as Sentry from "@sentry/react";
import App from './App.tsx'
import './index.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.VITE_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.VITE_ENVIRONMENT === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Production services initialization
import { initializeProductionServices, setupGlobalErrorHandling } from '@/services/productionServices';
import { registerServiceWorker } from '@/utils/serviceWorker';

// Initialize global error handling immediately
setupGlobalErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Initialize production services and render app
async function initializeApp() {
  try {
    // Initialize production services (security, monitoring, health checks)
    if (import.meta.env.VITE_ENVIRONMENT === 'production') {
      await initializeProductionServices();
      console.log('🚀 Production services initialized successfully');
    } else {
      console.log('🔧 Running in development mode, production services disabled');
    }

    // Register service worker for caching and offline support
    await registerServiceWorker();

    // Render the application
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>,
    );
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    
    // Show error page if production services fail to initialize
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Inter, sans-serif;">
          <div style="text-align: center; padding: 2rem; border-radius: 8px; background: #fee2e2; color: #dc2626;">
            <h1 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Application Initialization Failed</h1>
            <p style="margin: 0; opacity: 0.8;">The application failed to start properly. Please try refreshing the page.</p>
            <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Start the application
initializeApp();
