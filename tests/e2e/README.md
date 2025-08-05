# Comprehensive End-to-End (E2E) Tests

This directory contains comprehensive end-to-end tests that validate the complete application workflow from administrator login through file upload to dashboard analysis.

## Test Structure

```
tests/e2e/
├── fixtures/                      # Test data and credentials
│   ├── test-credentials.ts         # Test user credentials
│   └── test-files.ts              # File paths and expected data
├── helpers/                       # Test utility functions
│   ├── auth-helpers.ts            # Authentication utilities
│   ├── upload-helpers.ts          # File upload utilities
│   ├── dashboard-helpers.ts       # Dashboard navigation and validation
│   └── test-setup.ts              # Environment setup utilities
├── comprehensive-workflow.spec.ts # Main comprehensive test suite
├── global-setup.ts                # Global test setup
└── README.md                      # This file
```

## Test Coverage

### Core Workflow Tests
- **Administrator Authentication**: Login with test admin credentials
- **File Upload and Processing**: Upload financial data files and verify processing
- **Dashboard Navigation**: Navigate through all main dashboards
- **Data Validation**: Verify expected data appears in dashboards
- **Error Handling**: Test error scenarios and recovery

### Specific Test Scenarios
1. **Complete Application Workflow**
   - Login as administrator
   - Upload core financial data files
   - Validate file processing
   - Navigate through all dashboards
   - Verify data consistency

2. **File Format Validation**
   - Test different CSV formats (comma, semicolon delimited)
   - Verify data parsing and processing
   - Check error handling for invalid files

3. **Dashboard Accessibility**
   - Test responsive design across viewports
   - Validate dashboard content and elements
   - Check navigation functionality

4. **Error Handling and Recovery**
   - Test invalid routes
   - Verify application stability
   - Check session management

## Dashboard Pages Tested

- **Cuenta P&G** (`/cuenta-pyg`): Profit & Loss statement
- **Balance de Situación** (`/balance-situacion`): Balance sheet
- **Ratios Financieros** (`/ratios-financieros`): Financial ratios
- **Flujos de Caja** (`/flujos-caja`): Cash flow analysis
- **Análisis NOF** (`/analisis-nof`): Working capital analysis
- **Punto Muerto** (`/punto-muerto`): Break-even analysis

## Test Data Files

The tests use files from `public/templates/`:
- `cuenta-pyg.csv`: P&L data
- `balance-situacion.csv`: Balance sheet data
- `valid_comma.csv`: Comma-delimited test data
- `valid_semicolon.csv`: Semicolon-delimited test data
- `test-data.csv`: General test data

## Test Users

Tests require predefined users with specific roles:

### Admin User
- **Email**: `admin@test.finanzas-pyme.com`
- **Password**: `AdminTest123!`
- **Role**: Administrator (full access)

### Viewer User
- **Email**: `viewer@test.finanzas-pyme.com`
- **Password**: `ViewerTest123!`
- **Role**: Viewer (limited access)

## Setup Requirements

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Test User Creation
Test users can be created automatically:
```bash
npm run create-test-users
```

Or manually using the admin interface.

## Running Tests

### Quick Start
```bash
# Install browsers and run comprehensive tests
npm run test:e2e:comprehensive
```

### Individual Commands
```bash
# Setup test environment
npm run test:e2e:setup

# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run comprehensive workflow tests only
playwright test tests/e2e/comprehensive-workflow.spec.ts

# Run in headed mode for debugging
playwright test tests/e2e/comprehensive-workflow.spec.ts --headed
```

### CI/CD Integration
```bash
# For CI environments
npm run test:e2e:ci
```

## Test Configuration

### Playwright Settings
- **Timeout**: 60 seconds per test (for file upload workflows)
- **Retries**: 1-2 retries for flaky network operations
- **Workers**: Single worker to avoid authentication conflicts
- **Screenshots**: On failure only
- **Videos**: Retained on failure

### Custom Settings
- Sequential execution to avoid auth state conflicts
- Extended timeouts for file processing
- Comprehensive error logging
- Responsive design validation

## Debugging Tests

### Local Development
1. Run with headed browser:
   ```bash
   playwright test --headed
   ```

2. Use debug mode:
   ```bash
   playwright test --debug
   ```

3. View test trace:
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

### Common Issues

#### Authentication Failures
- Verify test users exist: `npm run create-test-users`
- Check Supabase configuration
- Verify environment variables

#### File Upload Issues
- Ensure test files exist in `public/templates/`
- Check file permissions
- Verify upload page accessibility

#### Dashboard Validation Failures
- Upload test data first
- Check network connectivity
- Verify dashboard routes are accessible

## Extending Tests

### Adding New Dashboards
1. Add dashboard configuration to `DASHBOARD_PAGES` in `dashboard-helpers.ts`
2. Include expected elements and key indicators
3. Update comprehensive workflow test

### Adding New Test Files
1. Add file configuration to `TEST_FILES` in `test-files.ts`
2. Include expected data elements
3. Create corresponding CSV file in `public/templates/`

### Custom Assertions
```typescript
// Example custom validation
await expect(page.locator('text=EBITDA')).toBeVisible();
await expect(page.locator('[data-testid="financial-chart"]')).toBeVisible();
```

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run E2E tests
  run: |
    npm run test:e2e:setup
    npm run test:e2e:ci
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Test Reporting
- HTML reports generated in `playwright-report/`
- JSON results in `test-results/e2e-results.json`
- Screenshots and videos in `test-results/`

## Best Practices

1. **Test Isolation**: Each test clears authentication state
2. **Data Cleanup**: Tests use dedicated test users and data
3. **Error Handling**: Tests continue even with partial failures
4. **Comprehensive Validation**: Multiple assertion strategies
5. **Performance**: Optimized timeouts and retries
6. **Maintainability**: Modular helper functions and fixtures

## Troubleshooting

### Environment Issues
- Verify `.env` file configuration
- Check Supabase project status
- Ensure all required dependencies are installed

### Test Flakiness
- Tests include retry logic and extended timeouts
- Authentication state is cleared between tests
- File uploads wait for processing completion

### Performance Optimization
- Tests run sequentially to avoid conflicts
- Shared test data to reduce setup time
- Optimized selectors and waits