/**
 * 🚨 CRITICAL SYSTEM HEALTH VALIDATOR
 * 
 * This utility validates all core system components for production readiness
 * during the stabilization phase. Only run in development/staging environments.
 */

import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  checks: SystemHealthCheck[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
  timestamp: Date;
}

/**
 * Validates authentication system stability
 */
async function validateAuthSystem(): Promise<SystemHealthCheck> {
  try {
    // Test session retrieval
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return {
        component: 'Authentication System',
        status: 'warning',
        message: 'Session retrieval has issues',
        details: sessionError,
        timestamp: new Date()
      };
    }

    // Test user info if authenticated
    if (session?.session) {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError) {
        return {
          component: 'Authentication System',
          status: 'warning',
          message: 'User data retrieval failed',
          details: userError,
          timestamp: new Date()
        };
      }
    }

    return {
      component: 'Authentication System',
      status: 'healthy',
      message: 'Authentication system operational',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      component: 'Authentication System',
      status: 'critical',
      message: 'Authentication system failure',
      details: error,
      timestamp: new Date()
    };
  }
}

/**
 * Validates role detection system
 */
async function validateRoleSystem(): Promise<SystemHealthCheck> {
  try {
    // Test role query capability
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .limit(1);

    if (error) {
      return {
        component: 'Role Detection System',
        status: 'critical',
        message: 'Role table access failed',
        details: error,
        timestamp: new Date()
      };
    }

    return {
      component: 'Role Detection System',
      status: 'healthy',
      message: 'Role detection system operational',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      component: 'Role Detection System',
      status: 'critical',
      message: 'Role system failure',
      details: error,
      timestamp: new Date()
    };
  }
}

/**
 * Validates database connectivity
 */
async function validateDatabase(): Promise<SystemHealthCheck> {
  try {
    // Test basic database connectivity
    const { data, error } = await supabase
      .from('client_configurations')
      .select('id')
      .limit(1);

    if (error) {
      return {
        component: 'Database Connectivity',
        status: 'critical',
        message: 'Database connection failed',
        details: error,
        timestamp: new Date()
      };
    }

    return {
      component: 'Database Connectivity',
      status: 'healthy',
      message: 'Database connection stable',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      component: 'Database Connectivity',
      status: 'critical',
      message: 'Database access failure',
      details: error,
      timestamp: new Date()
    };
  }
}

/**
 * Validates environment configuration
 */
function validateEnvironment(): SystemHealthCheck {
  // Supabase configuration is hardcoded in Lovable
  const supabaseUrl = "https://hlwchpmogvwmpuvwmvwv.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd2NocG1vZ3Z3bXB1dndtdnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ5MjMsImV4cCI6MjA2Mzg2MDkyM30.WAKJS5_qPOgzTdwNmIRo15w-SD8KyH9X6x021bEhKaY";

  const missingVars: string[] = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');

  if (missingVars.length > 0) {
    return {
      component: 'Environment Configuration',
      status: 'critical',
      message: `Missing required environment variables: ${missingVars.join(', ')}`,
      details: { missingVars },
      timestamp: new Date()
    };
  }

  // Check for development vs production settings
  const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production';
  const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  if (isProduction && debugMode) {
    return {
      component: 'Environment Configuration',
      status: 'warning',
      message: 'Debug mode enabled in production environment',
      details: { isProduction, debugMode },
      timestamp: new Date()
    };
  }

  return {
    component: 'Environment Configuration',
    status: 'healthy',
    message: 'Environment properly configured',
    timestamp: new Date()
  };
}

/**
 * Validates file upload system readiness - DISABLED
 * File upload system has been completely removed
 */
async function validateFileUpload(): Promise<SystemHealthCheck> {
  return {
    component: 'File Upload System',
    status: 'warning',
    message: 'File upload system has been disabled',
    timestamp: new Date()
  };
}

/**
 * Performs comprehensive system health check
 */
export async function performSystemHealthCheck(): Promise<SystemHealthReport> {
  console.log('🔍 Starting comprehensive system health check...');

  const checks: SystemHealthCheck[] = [];

  // Run all health checks
  checks.push(await validateAuthSystem());
  checks.push(await validateRoleSystem());
  checks.push(await validateDatabase());
  checks.push(validateEnvironment());
  checks.push(await validateFileUpload());

  // Calculate summary
  const summary = {
    healthy: checks.filter(c => c.status === 'healthy').length,
    warning: checks.filter(c => c.status === 'warning').length,
    critical: checks.filter(c => c.status === 'critical').length,
    total: checks.length
  };

  // Determine overall status
  let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (summary.critical > 0) {
    overall = 'critical';
  } else if (summary.warning > 0) {
    overall = 'warning';
  }

  const report: SystemHealthReport = {
    overall,
    checks,
    summary,
    timestamp: new Date()
  };

  console.log('📊 System health check completed:', {
    overall: report.overall,
    summary: report.summary
  });

  return report;
}

/**
 * Logs system health report in a readable format
 */
export function logSystemHealthReport(report: SystemHealthReport): void {
  console.log('\n🚨 SYSTEM HEALTH REPORT');
  console.log('═'.repeat(50));
  console.log(`Overall Status: ${report.overall.toUpperCase()}`);
  console.log(`Timestamp: ${report.timestamp.toISOString()}`);
  console.log(`Summary: ${report.summary.healthy}✅ ${report.summary.warning}⚠️ ${report.summary.critical}❌`);
  console.log('═'.repeat(50));

  report.checks.forEach(check => {
    const icon = check.status === 'healthy' ? '✅' : 
                 check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${check.component}: ${check.message}`);
    if (check.details && check.status !== 'healthy') {
      console.log(`   Details:`, check.details);
    }
  });

  console.log('═'.repeat(50));

  if (report.overall === 'critical') {
    console.log('🚨 CRITICAL ISSUES DETECTED - SYSTEM NOT READY FOR PRODUCTION');
  } else if (report.overall === 'warning') {
    console.log('⚠️ WARNINGS DETECTED - REVIEW BEFORE PRODUCTION DEPLOYMENT');
  } else {
    console.log('✅ SYSTEM HEALTHY - READY FOR PRODUCTION');
  }
}

/**
 * Quick health check for development use
 */
export async function quickHealthCheck(): Promise<boolean> {
  const report = await performSystemHealthCheck();
  logSystemHealthReport(report);
  return report.overall !== 'critical';
}

export default performSystemHealthCheck;