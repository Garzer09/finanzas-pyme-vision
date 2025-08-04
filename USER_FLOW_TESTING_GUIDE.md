# User Flow Testing and Debugging Guide

This document describes the comprehensive user flow testing and debugging suite implemented for the finanzas-pyme-vision application.

## Overview

The application now includes a comprehensive testing and debugging infrastructure designed to ensure reliable authentication flows, detect issues early, and provide detailed debugging capabilities for production troubleshooting.

## Test Suite Architecture

### 1. Authentication State Machine Testing (`auth.test.ts`)
- **Coverage**: 34 test scenarios
- **Purpose**: Validates all authentication state transitions
- **Key Areas**:
  - State transition validation
  - Admin vs viewer login flows
  - Session recovery and role preservation
  - Error state handling and recovery mechanisms

### 2. Navigation Flow Testing (`navigation-flow.test.ts`)
- **Coverage**: 16 test scenarios
- **Purpose**: Comprehensive navigation and routing validation
- **Key Areas**:
  - Enhanced `shouldNavigateAfterAuth` function testing
  - Post-authentication navigation validation
  - Role-based routing logic
  - Direct URL access protection
  - Edge cases and boundary conditions

### 3. Role Detection and Permissions Testing (`role-detection.test.ts`)
- **Coverage**: 21 test scenarios
- **Purpose**: Validates role detection and permission systems
- **Key Areas**:
  - RPC fallback to table lookup mechanism
  - Admin creation wizard role assignment
  - Real-time role changes and UI updates
  - Role-based access control validation

### 4. Session Management and Inactivity Testing (`session-management.test.ts`)
- **Coverage**: 16 test scenarios
- **Purpose**: Validates session lifecycle and inactivity detection
- **Key Areas**:
  - 30-minute inactivity timeout flow
  - Warning system and timer reset functionality
  - Multi-tab activity synchronization
  - Session cleanup on logout

### 5. Error Recovery and Network Resilience Testing (`error-recovery.test.ts`)
- **Coverage**: 15 test scenarios
- **Purpose**: Validates error handling and network resilience
- **Key Areas**:
  - Network failure retry logic with exponential backoff
  - Token refresh failure recovery
  - Corrupted session cleanup
  - Circuit breaker patterns

### 6. End-to-End User Journey Testing (`end-to-end-journeys.test.ts`)
- **Coverage**: 15 test scenarios
- **Purpose**: Complete user workflow validation
- **Key Areas**:
  - Complete admin journey (Login → Create User → Verify Access → Logout)
  - Complete viewer journey (Login → Dashboard → Data Access → Session Timeout)
  - Recovery journey (Forgot Password → Reset → Login → Normal Flow)
  - Cross-browser and cross-device consistency

### 7. Security and Edge Case Validation (`security-validation.test.ts`)
- **Coverage**: 18 test scenarios
- **Purpose**: Security validation and attack prevention
- **Key Areas**:
  - Direct URL access without authentication
  - Role escalation attempt blocking
  - Expired token automatic refresh
  - CSRF and session hijacking protection
  - Advanced security scenarios

## Debugging Infrastructure

### 1. AuthFlowLogger
```typescript
import { AuthFlowLogger } from '@/utils/authFlowDebugger';

const logger = AuthFlowLogger.getInstance();
logger.info('User login attempt', { userId: 'user123', role: 'admin' });
logger.error('Authentication failed', { error: 'Invalid credentials' });
```

**Features**:
- Structured logging with levels (debug, info, warn, error)
- Automatic log rotation (keeps last 1000 entries)
- JSON export capability
- Real-time log viewing in debug dashboard

### 2. AuthPerformanceMonitor
```typescript
import { AuthPerformanceMonitor } from '@/utils/authFlowDebugger';

const perfMonitor = AuthPerformanceMonitor.getInstance();
perfMonitor.startTimer('user_login');
// ... authentication logic
perfMonitor.endTimer('user_login');
```

**Features**:
- Performance timing for authentication operations
- Automatic performance issue detection (>2s operations)
- Average, min, max calculation per operation type
- Performance metrics export

### 3. AuthErrorTracker
```typescript
import { AuthErrorTracker } from '@/utils/authFlowDebugger';

const errorTracker = AuthErrorTracker.getInstance();
errorTracker.trackError('critical', 'Authentication system down', context, userId);
```

**Features**:
- Error categorization (warning, error, critical)
- Automatic alerting for critical errors
- Error frequency tracking
- Error resolution tracking

### 4. useAuthFlowMonitoring Hook
```typescript
import { useAuthFlowMonitoring } from '@/utils/authFlowDebugger';

function MyComponent() {
  const { logger, perfMonitor, exportDebugData } = useAuthFlowMonitoring();
  
  // Automatic monitoring of auth state changes
  // Access to logging and performance monitoring
  // Export capabilities for debugging
}
```

## Debug Dashboard

### Accessing the Debug Dashboard

**Keyboard Shortcuts**:
- `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac): Open general debug dashboard
- `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac): Open auth flow debug dashboard

**UI Access**:
- Debug buttons appear in bottom-right corner in development mode
- Shield icon opens the auth flow debugging dashboard

### Dashboard Features

#### 1. Overview Tab
- System health status
- Real-time metrics summary
- Recent activity feed
- Performance summary

#### 2. Logs Tab
- Real-time log streaming
- Filterable by log level
- Expandable data context
- Search and export capabilities

#### 3. Performance Tab
- Operation timing metrics
- Performance issue highlighting
- Historical performance data
- Optimization recommendations

#### 4. Errors Tab
- Error tracking and management
- Error categorization and severity
- Resolution tracking
- Context and stack traces

#### 5. Validation Tab
- Automated flow validation runner
- Pass/fail status for critical flows
- Detailed validation results
- Manual test triggering

#### 6. Checklist Tab
- Manual verification checklist
- Category-based organization
- Progress tracking
- Compliance verification

## User Flow Validation Checklist

### Authentication Flows
- [ ] Login form accepts valid credentials
- [ ] Login form rejects invalid credentials
- [ ] Login redirects to appropriate dashboard based on role
- [ ] Session is properly established after login
- [ ] Authentication errors are displayed clearly

### Navigation Flows
- [ ] Admin users can access admin routes
- [ ] Viewer users cannot access admin routes
- [ ] Unauthenticated users are redirected to login
- [ ] Post-login navigation works correctly
- [ ] Protected routes require authentication

### Role Detection
- [ ] RPC role fetch works correctly
- [ ] Table lookup fallback works when RPC fails
- [ ] Role changes are reflected in UI immediately
- [ ] Role-based permissions are enforced
- [ ] Default role assignment works for new users

### Session Management
- [ ] Inactivity warning appears at correct time
- [ ] Session timeout works after 30 minutes
- [ ] Session extension resets the timer
- [ ] Multi-tab activity is synchronized
- [ ] Session cleanup occurs on logout

### Error Recovery
- [ ] Network failures trigger retry logic
- [ ] Token refresh works automatically
- [ ] Expired tokens are handled gracefully
- [ ] Corrupted sessions are cleaned up
- [ ] Circuit breaker prevents cascading failures

### Security
- [ ] Direct URL access is protected
- [ ] Role escalation attempts are blocked
- [ ] CSRF tokens are validated
- [ ] Session hijacking is detected
- [ ] Input sanitization prevents XSS

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
npm test -- auth.test.ts                    # Authentication tests
npm test -- navigation-flow.test.ts        # Navigation tests  
npm test -- role-detection.test.ts         # Role detection tests
npm test -- session-management.test.ts     # Session management tests
npm test -- error-recovery.test.ts         # Error recovery tests
npm test -- end-to-end-journeys.test.ts    # E2E journey tests
npm test -- security-validation.test.ts    # Security tests
```

### Test Coverage
```bash
npm run test:coverage
```

## Production Debugging

### Enabling Debug Mode
```typescript
// Enable debug mode programmatically
import { AuthFlowLogger } from '@/utils/authFlowDebugger';
const logger = AuthFlowLogger.getInstance();

// Or via URL parameter
// https://yourapp.com?debug=true
```

### Exporting Debug Data
```typescript
import { getAuthFlowDebugData } from '@/utils/authFlowDebugger';

const debugData = getAuthFlowDebugData();
console.log(JSON.stringify(debugData, null, 2));
```

### Production Monitoring Integration

The debug infrastructure can be integrated with monitoring services:

```typescript
// Example integration with monitoring service
const errorTracker = AuthErrorTracker.getInstance();
errorTracker.trackError('critical', 'Database connection failed', {
  database: 'users',
  query: 'SELECT role FROM user_roles',
  timestamp: Date.now()
}, userId);

// This could automatically send alerts to:
// - Sentry
// - DataDog  
// - PagerDuty
// - Slack webhooks
// - Email notifications
```

## Best Practices

### 1. Test Organization
- Keep tests focused on specific scenarios
- Use descriptive test names
- Group related tests in describe blocks
- Mock external dependencies appropriately

### 2. Debugging Workflow
- Use debug dashboard for real-time monitoring
- Export debug data for offline analysis
- Check error tracking for patterns
- Validate performance metrics regularly

### 3. Production Considerations
- Enable debug mode only when needed
- Monitor error patterns and frequencies
- Set up automated alerts for critical errors
- Regular review of performance metrics

### 4. Security
- Never log sensitive information (passwords, tokens)
- Sanitize user input in logs
- Implement proper access controls for debug features
- Regular security validation testing

## Troubleshooting Common Issues

### Authentication Loops
1. Check auth state transitions in debug dashboard
2. Verify role detection is working correctly
3. Review navigation flow logs
4. Check for token expiration issues

### Performance Issues
1. Review performance metrics in dashboard
2. Check for long-running operations (>2s)
3. Analyze retry patterns and failures
4. Monitor memory usage and cleanup

### Role Detection Failures
1. Verify RPC function availability
2. Check fallback table lookup mechanism  
3. Review role assignment workflows
4. Validate permission enforcement

### Session Management Issues
1. Check inactivity timer configuration
2. Review multi-tab synchronization
3. Verify session cleanup processes
4. Monitor token refresh cycles

## Contributing to Tests

When adding new features or fixing bugs:

1. Add corresponding test cases
2. Update the validation checklist if needed
3. Ensure debug logging is comprehensive
4. Add performance monitoring for new operations
5. Update documentation as needed

## Conclusion

This comprehensive testing and debugging suite provides:
- **163 test scenarios** covering all critical user flows
- **Real-time debugging capabilities** for production troubleshooting
- **Performance monitoring** for optimization opportunities
- **Security validation** for attack prevention
- **Structured logging** for issue investigation

The implementation ensures reliable user flows and enables confident development of new features without breaking existing functionality.