# Developer Quick Reference Guide

## 🚀 Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

### Testing
```bash
# Unit tests with coverage
npm run test:coverage

# Interactive test UI
npm run test:ui

# Specific test file
npm run test -- path/to/test.ts
```

### Building
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview build
npm run preview
```

## 🔧 Key Components

### Error Boundaries
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary 
  level="component" 
  context={{ feature: 'file-upload' }}
>
  <YourComponent />
</ErrorBoundary>
```

### Fallback Components
```typescript
import { 
  DashboardFallback, 
  FileUploadFallback, 
  AuthFallback,
  GenericFallback 
} from '@/components/FallbackComponents';

// Use as error boundary fallbacks
<ErrorBoundary fallback={<DashboardFallback />}>
  <Dashboard />
</ErrorBoundary>
```

### Data Validation
```typescript
import { 
  DataSanitizer, 
  AccountingValidator, 
  DataValidationPipeline 
} from '@/utils/dataValidation';

// Sanitize financial data
const amount = DataSanitizer.sanitizeAmount('$1,234.56'); // 1234.56

// Validate journal entries
const result = AccountingValidator.validateJournalEntry(entries);

// Validate complete file
const validation = await DataValidationPipeline.validateFinancialFile(data);
```

### Service Worker
```typescript
import { registerServiceWorker } from '@/utils/serviceWorker';

// Register in main.tsx (already implemented)
await registerServiceWorker();
```

## 🛡️ Security

### Input Sanitization
```typescript
// Automatic sanitization in data validation pipeline
const sanitized = DataSanitizer.sanitizeAccountName(userInput);
const cleanAmount = DataSanitizer.sanitizeAmount(userAmount);
```

### Error Reporting
```typescript
// Automatic with ErrorBoundary, or manual:
import * as Sentry from '@sentry/react';

Sentry.captureException(error, {
  tags: { feature: 'file-upload' },
  contexts: { user: { id: userId } }
});
```

## 📊 Monitoring

### Sentry Integration
- Automatic error capture via ErrorBoundary
- Performance monitoring enabled
- User session replay for debugging
- Custom error context and tags

### Health Checks
```typescript
// Production services health check
import { productionServices } from '@/services/productionServices';

const status = productionServices.getSystemStatus();
```

## 🧪 Testing Best Practices

### Unit Tests
```typescript
// Example test structure
describe('ComponentName', () => {
  it('should handle valid input', () => {
    const result = functionToTest(validInput);
    expect(result).toBe(expectedOutput);
  });

  it('should reject invalid input', () => {
    expect(() => functionToTest(invalidInput)).toThrow();
  });
});
```

### E2E Tests
```typescript
// Example E2E test
test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## 🔄 CI/CD

### GitHub Actions
- Automatic testing on PR
- Security scanning
- Deployment to staging/production
- Artifact collection

### Environment Variables
```bash
# Required for production
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_ENVIRONMENT=production
```

## 🐛 Debugging

### Common Issues

1. **Service Worker not registering**
   - Check if running in production mode
   - Verify service worker file exists in public/

2. **Tests failing**
   - Check environment variable mocking
   - Verify test setup files

3. **Build errors**
   - Check for TypeScript errors
   - Verify all imports are correct

4. **Sentry not capturing errors**
   - Verify VITE_SENTRY_DSN is set
   - Check error boundary implementation

### Debugging Tools
- **Vitest UI**: `npm run test:ui`
- **Playwright Inspector**: `npx playwright test --debug`
- **Sentry Dashboard**: Real-time error monitoring
- **Service Worker DevTools**: Application > Service Workers

## 📚 File Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx       # Enhanced error boundary
│   └── FallbackComponents.tsx  # Fallback UI components
├── utils/
│   ├── dataValidation.ts       # Financial data validation
│   ├── serviceWorker.ts        # SW registration utilities
│   └── __tests__/
│       └── dataValidation.test.ts
├── services/
│   └── productionServices.ts   # Production monitoring
└── __tests__/
    └── setup.ts               # Test environment setup

e2e/
└── auth-flow.spec.ts          # E2E test scenarios

public/
├── sw.js                      # Service worker
└── offline.html              # Offline fallback

.github/
└── workflows/
    └── ci.yml                 # CI/CD pipeline
```

## 🎯 Production Checklist

Before deploying:
- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured
- [ ] Sentry project configured
- [ ] Error boundaries tested
- [ ] Service worker registered
- [ ] Fallback components working

## 📞 Support

For issues:
1. Check this documentation
2. Review test files for examples
3. Check Sentry dashboard for errors
4. Review CI/CD pipeline logs