/**
 * 🚨 CODE FREEZE ENFORCEMENT
 * 
 * This module enforces code freeze restrictions during critical stabilization periods.
 * It prevents non-critical features from being enabled in production builds.
 */

// Code freeze status - set to true to enable code freeze
export const CODE_FREEZE_ACTIVE = true;

// Code freeze configuration
export const CODE_FREEZE_CONFIG = {
  startDate: '2024-08-05',
  reason: 'Critical system stabilization (Issue #16)',
  allowedOperations: [
    'critical-bug-fixes',
    'security-patches',
    'production-stability',
    'test-fixes',
    'configuration-updates',
    'documentation-updates'
  ],
  blockedOperations: [
    'new-features',
    'ui-improvements',
    'performance-optimizations',
    'refactoring',
    'experimental-features',
    'non-critical-changes'
  ]
};

// Feature flags that are disabled during code freeze
export const FROZEN_FEATURES = {
  // Disable new experimental features
  enableExperimentalFeatures: false,
  
  // Disable non-critical UI enhancements
  enableAdvancedAnimations: false,
  enableNewUIComponents: false,
  
  // Disable performance experiments
  enableExperimentalOptimizations: false,
  enableBetaCaching: false,
  
  // Keep only stable, tested features
  enableStableFeatures: true,
  enableCriticalFixes: true,
  enableSecurityFeatures: true,
  
  // Monitoring and debugging remain active
  enableSystemMonitoring: true,
  enableErrorTracking: true,
  enableHealthChecks: true,
  enableDebugMode: !import.meta.env.PROD
};

/**
 * Checks if a feature is allowed during code freeze
 */
export function isFeatureAllowed(featureName: keyof typeof FROZEN_FEATURES): boolean {
  if (!CODE_FREEZE_ACTIVE) {
    return true; // All features allowed when code freeze is not active
  }
  
  return FROZEN_FEATURES[featureName] ?? false;
}

/**
 * Throws an error if trying to use a blocked feature during code freeze
 */
export function enforceCodeFreeze(operation: string, isCritical: boolean = false): void {
  if (!CODE_FREEZE_ACTIVE) {
    return; // No enforcement when code freeze is not active
  }
  
  if (isCritical) {
    console.warn(`🚨 CRITICAL OPERATION ALLOWED DURING CODE FREEZE: ${operation}`);
    return;
  }
  
  if (!CODE_FREEZE_CONFIG.allowedOperations.includes(operation)) {
    const message = `🛑 CODE FREEZE ACTIVE: Operation "${operation}" is blocked during stabilization period.\n` +
                   `Reason: ${CODE_FREEZE_CONFIG.reason}\n` +
                   `Started: ${CODE_FREEZE_CONFIG.startDate}\n` +
                   `Allowed operations: ${CODE_FREEZE_CONFIG.allowedOperations.join(', ')}`;
    
    console.error(message);
    throw new Error(`Code freeze violation: ${operation}`);
  }
}

/**
 * Returns the current code freeze status
 */
export function getCodeFreezeStatus() {
  return {
    active: CODE_FREEZE_ACTIVE,
    config: CODE_FREEZE_CONFIG,
    frozenFeatures: Object.entries(FROZEN_FEATURES)
      .filter(([_, enabled]) => !enabled)
      .map(([feature, _]) => feature)
  };
}

/**
 * Safe feature check that logs warnings instead of throwing errors
 */
export function checkFeatureSafely(featureName: keyof typeof FROZEN_FEATURES): boolean {
  const allowed = isFeatureAllowed(featureName);
  
  if (!allowed && CODE_FREEZE_ACTIVE) {
    console.warn(`⚠️ Feature "${featureName}" is disabled during code freeze`);
  }
  
  return allowed;
}

// Development helper to log code freeze status
if (import.meta.env.DEV) {
  console.log('🚨 Code Freeze Status:', getCodeFreezeStatus());
}