/**
 * 🚨 PRODUCTION STABILITY VALIDATOR
 * 
 * Critical component that validates system readiness for production deployment
 * and enforces stability requirements during the crisis response period.
 */

import { performSystemHealthCheck } from './systemHealthCheck';
import { getCodeFreezeStatus } from './codeFreeze';

export interface StabilityCheckResult {
  isStable: boolean;
  criticalIssues: string[];
  warnings: string[];
  timestamp: Date;
  recommendations: string[];
}

/**
 * Validates authentication system stability
 */
async function validateAuthStability(): Promise<{ issues: string[], warnings: string[] }> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if auth context is properly initialized
    if (typeof window !== 'undefined') {
      // Browser environment checks
      const authState = localStorage.getItem('supabase.auth.token');
      if (!authState) {
        warnings.push('No stored authentication state found');
      }
    }

    // Additional auth stability checks would go here
    // For now, we rely on the system health check
    
  } catch (error) {
    issues.push(`Authentication validation failed: ${error}`);
  }

  return { issues, warnings };
}

/**
 * Validates edge functions are properly configured
 */
async function validateEdgeFunctions(): Promise<{ issues: string[], warnings: string[] }> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // Check environment variables for edge functions
    const supabaseUrl = "https://hlwchpmogvwmpuvwmvwv.supabase.co";
    if (!supabaseUrl) {
      issues.push('Supabase URL not configured for edge functions');
    } else if (supabaseUrl.includes('localhost') && import.meta.env.PROD) {
      issues.push('Production build using localhost Supabase URL');
    }

    // Check if running in production mode
    if (!import.meta.env.PROD && import.meta.env.VITE_ENVIRONMENT === 'production') {
      warnings.push('Environment mismatch: VITE_ENVIRONMENT=production but not in production build');
    }

  } catch (error) {
    issues.push(`Edge function validation failed: ${error}`);
  }

  return { issues, warnings };
}

/**
 * Validates file upload system stability - DISABLED
 * File upload system has been completely removed
 */
async function validateFileUploadStability(): Promise<{ issues: string[], warnings: string[] }> {
  return {
    issues: [],
    warnings: ['File upload system has been disabled']
  };
}

/**
 * Validates production configuration
 */
function validateProductionConfig(): { issues: string[], warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check debug mode in production
  if (import.meta.env.PROD && import.meta.env.VITE_DEBUG_MODE === 'true') {
    issues.push('Debug mode enabled in production build');
  }

  // Check analytics configuration
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && !import.meta.env.VITE_SENTRY_DSN) {
    warnings.push('Analytics enabled but no Sentry DSN configured');
  }

  // Check rate limiting
  if (!import.meta.env.VITE_ENABLE_RATE_LIMITING && import.meta.env.PROD) {
    warnings.push('Rate limiting not enabled in production');
  }

  return { issues, warnings };
}

/**
 * Performs comprehensive production stability validation
 */
export async function validateProductionStability(): Promise<StabilityCheckResult> {
  console.log('🔍 Starting production stability validation...');

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    // Run system health check first
    const healthReport = await performSystemHealthCheck();
    
    // Convert health check results to stability format
    healthReport.checks.forEach(check => {
      if (check.status === 'critical') {
        criticalIssues.push(`${check.component}: ${check.message}`);
      } else if (check.status === 'warning') {
        warnings.push(`${check.component}: ${check.message}`);
      }
    });

    // Run specific stability validations
    const authValidation = await validateAuthStability();
    criticalIssues.push(...authValidation.issues);
    warnings.push(...authValidation.warnings);

    const edgeValidation = await validateEdgeFunctions();
    criticalIssues.push(...edgeValidation.issues);
    warnings.push(...edgeValidation.warnings);

    const fileValidation = await validateFileUploadStability();
    criticalIssues.push(...fileValidation.issues);
    warnings.push(...fileValidation.warnings);

    const configValidation = validateProductionConfig();
    criticalIssues.push(...configValidation.issues);
    warnings.push(...configValidation.warnings);

    // Check code freeze status
    const codeFreezeStatus = getCodeFreezeStatus();
    if (codeFreezeStatus.active) {
      recommendations.push('Code freeze is active - only critical fixes allowed');
      recommendations.push(`Frozen features: ${codeFreezeStatus.frozenFeatures.join(', ')}`);
    }

    // Generate recommendations based on issues
    if (criticalIssues.length > 0) {
      recommendations.push('CRITICAL: Resolve all critical issues before production deployment');
    }
    
    if (warnings.length > 0) {
      recommendations.push('Review and address all warnings before production deployment');
    }

    if (criticalIssues.length === 0 && warnings.length === 0) {
      recommendations.push('System appears stable for production deployment');
    }

  } catch (error) {
    criticalIssues.push(`Stability validation failed: ${error}`);
  }

  const result: StabilityCheckResult = {
    isStable: criticalIssues.length === 0,
    criticalIssues,
    warnings,
    timestamp: new Date(),
    recommendations
  };

  console.log('📊 Production stability validation completed:', {
    isStable: result.isStable,
    criticalIssues: result.criticalIssues.length,
    warnings: result.warnings.length
  });

  return result;
}

/**
 * Logs stability check results in a readable format
 */
export function logStabilityResults(result: StabilityCheckResult): void {
  console.log('\n🚨 PRODUCTION STABILITY REPORT');
  console.log('═'.repeat(60));
  console.log(`Stability Status: ${result.isStable ? '✅ STABLE' : '❌ UNSTABLE'}`);
  console.log(`Timestamp: ${result.timestamp.toISOString()}`);
  console.log(`Critical Issues: ${result.criticalIssues.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  console.log('═'.repeat(60));

  if (result.criticalIssues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    result.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  console.log('═'.repeat(60));

  if (!result.isStable) {
    console.log('🚨 SYSTEM NOT READY FOR PRODUCTION - RESOLVE CRITICAL ISSUES FIRST');
  } else if (result.warnings.length > 0) {
    console.log('⚠️ SYSTEM STABLE BUT HAS WARNINGS - REVIEW BEFORE DEPLOYMENT');
  } else {
    console.log('✅ SYSTEM READY FOR PRODUCTION DEPLOYMENT');
  }
}

/**
 * Quick stability check for CI/CD pipelines
 */
export async function quickStabilityCheck(): Promise<boolean> {
  const result = await validateProductionStability();
  logStabilityResults(result);
  return result.isStable;
}

export default validateProductionStability;