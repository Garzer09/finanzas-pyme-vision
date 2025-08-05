# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fc9a50c5-6c20-4e01-84b9-97b89b1ecfa8

## 🧪 Testing and Validation

This project includes a comprehensive testing and validation system designed for production readiness.

### Available Test Scripts

#### Core Testing Commands
```sh
# Run all unit tests
npm run test:unit

# Run component tests  
npm run test:components

# Run integration tests
npm run test:integration

# Run all tests with coverage report
npm run test:coverage

# Run tests with coverage threshold checking
npm run test:coverage:check

# Run end-to-end tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run all test suites
npm run test:all
```

#### Performance and Analysis
```sh
# Comprehensive stability check for production readiness
npm run stability-check

# Pre-deployment validation (includes stability check + build)
npm run pre-deploy

# Analyze bundle size and composition
npm run analyze:bundle

# Run performance tests
npm run test:performance
```

#### Validation Scripts
```sh
# Validate authentication system
npm run validate:auth

# Validate navigation and routing
npm run validate:navigation

# Validate error recovery and resilience
npm run validate:recovery

# Run all validation checks
npm run validate:all

# Authentication Testing (NEW)
# Create test users for authentication testing
npm run create-test-users

# Run comprehensive authentication tests
npm run test:auth
```

### 🧪 Comprehensive Test Suite

The project now includes a **comprehensive testing infrastructure** with:

#### Test Categories
- **Unit Tests** (`tests/unit/`): 24+ tests covering data validation, financial calculations, and utilities
- **Component Tests** (`tests/components/`): React component behavior with user interactions
- **Integration Tests** (`tests/integration/`): End-to-end workflow validation
- **E2E Tests** (`tests/e2e/`): Browser-based user journey testing

#### Test Infrastructure
- **✅ Vitest Configuration**: Optimized for comprehensive coverage with 70% threshold
- **✅ Test Fixtures**: Financial data, mock companies, and user profiles
- **✅ Mock System**: Supabase client, file system, and external service mocks
- **✅ Global Setup**: Proper test environment with DOM mocking

#### Coverage Requirements
- **Global Coverage**: 70% minimum (lines, functions, branches, statements)
- **Critical Modules**: 90% minimum for data validation and financial logic
- **Services**: 80% minimum for business logic services

### 🔐 Authentication Testing System

The project includes a comprehensive authentication testing system with automated test user creation and validation.

#### Quick Start - Authentication Testing

1. **Create Test Users**:
   ```sh
   npm run create-test-users
   ```

2. **Run Authentication Tests**:
   ```sh
   npm run test:auth
   ```

3. **Manual Testing Credentials**:
   - **Admin User**: `admin@test.finanzas-pyme.com` / `AdminTest123!`
   - **Viewer User**: `viewer@test.finanzas-pyme.com` / `ViewerTest123!`

#### Authentication Test Coverage

The authentication test suite validates:
- ✅ **Login/Logout Flows**: Success and failure scenarios
- ✅ **Role-Based Access Control**: Admin vs viewer permissions
- ✅ **Session Management**: Token refresh, concurrent sessions
- ✅ **Security Features**: Rate limiting, input sanitization, CSRF protection
- ✅ **Password Security**: Validation, reset flows, brute force protection
- ✅ **Permission Enforcement**: Route protection, data access controls

### 🚀 CI/CD Integration

#### GitHub Actions Workflow (`.github/workflows/test.yml`)
- **Unit Tests**: Multi-Node.js version testing (18.x, 20.x)
- **Component Tests**: React component validation
- **Integration Tests**: Full workflow testing with database
- **E2E Tests**: Browser-based testing across platforms  
- **Performance Tests**: Bundle analysis and load time validation
- **Security Tests**: Vulnerability scanning and code analysis
- **Coverage Reporting**: Automated coverage tracking with Codecov

#### Test Matrix
| Node Version | Test Types | Coverage |
|-------------|------------|----------|
| 18.x, 20.x | All Types | Full |
| Multiple OS | Unit + Component | Cross-platform |

### 📊 Test Fixtures and Utilities

#### Financial Data Fixtures (`tests/fixtures/financial-data.ts`)
```typescript
import { mockFinancialEntry, mockBalanceSheet } from '@tests/fixtures/financial-data';

// Pre-built test data for consistent testing
const testEntry = createMockFinancialEntry({
  debit: 1000,
  account: 'Custom Account'
});
```

#### Mock Services (`tests/__mocks__/`)
- **Supabase Client**: Database operations and authentication
- **File System**: Upload/download simulation
- **Template Service**: Configuration and template processing

### 📈 Performance and Security Testing

#### Performance Monitoring
- **Bundle Size Analysis**: Automated size tracking and optimization recommendations
- **Load Time Testing**: Performance regression detection
- **Memory Usage**: Resource consumption monitoring

#### Security Validation
- **Input Sanitization**: XSS and injection protection testing
- **Authentication Security**: Brute force and session hijacking protection
- **Dependency Scanning**: Automated vulnerability detection

#### Detailed Testing Documentation

For comprehensive testing instructions, see: **[docs/TESTING.md](docs/TESTING.md)**

#### Environment Requirements for Testing

```env
# Required in .env file
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Enable debug mode
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGING=true
```

### Test Structure

The project uses a dual testing approach:

#### 1. Component-Level Tests (`src/components/__tests__/`)
- Detailed tests for specific components and functionality
- Authentication flows and security validation
- Session management and role detection
- Error recovery and network resilience
- End-to-end user journeys

#### 2. Base Test Suites (`tests/`)
- **`tests/auth.test.ts`** - Authentication system base tests
- **`tests/navigation.test.ts`** - Navigation and routing base tests
- **`tests/error-recovery.test.ts`** - Error recovery and resilience base tests
- **`tests/stability.test.ts`** - System stability and performance base tests

### Testing Configuration

The project uses **Vitest** for unit/integration testing and **Playwright** for E2E testing:

- **Vitest Config**: `vitest.config.ts` - Optimized for comprehensive coverage
- **Playwright Config**: `playwright.config.ts` - Configured for robust E2E testing
- **Coverage Thresholds**: 70% minimum coverage for production readiness

### Validation Scripts Details

#### Stability Check (`npm run stability-check`)
Comprehensive validation including:
- ✅ Code freeze status verification
- ✅ Complete test suite execution
- ✅ Build process validation
- ✅ Environment configuration check
- ✅ Critical file presence verification
- ✅ Authentication system validation
- ✅ Security configuration check
- ✅ Error boundary validation

#### Authentication Validation (`npm run validate:auth`)
Specialized validation for:
- Authentication flows (login/logout)
- Session management
- Role detection and permissions
- Security validation features
- Production security measures

#### Navigation Validation (`npm run validate:navigation`)
Validates:
- Navigation flow tests
- End-to-end user journeys
- Routing protection mechanisms
- Accessibility compliance
- User experience flows

#### Error Recovery Validation (`npm run validate:recovery`)
Tests:
- Error recovery mechanisms
- Network resilience
- Timeout and retry logic
- Error boundaries implementation
- Fallback component coverage

### Test Coverage Requirements

For production deployment, the following coverage thresholds must be met:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Running Tests in CI/CD

All validation scripts are designed to run in CI/CD environments:

```sh
# Set CI environment variable for optimal test execution
export CI=true

# Run comprehensive validation
npm run validate:all
```

### Development Testing Workflow

1. **During Development**: `npm test` for rapid feedback
2. **Before Commit**: `npm run test:coverage` to ensure coverage
3. **Before Push**: `npm run validate:all` for comprehensive validation
4. **Pre-Production**: `npm run stability-check` for deployment readiness

## Environment Configuration

### Supabase Edge Functions

The project includes Supabase Edge Functions that require environment configuration:

- **DENO_ENV**: Set to `development` for development mode, or any other value for production mode
  - In development mode (`DENO_ENV=development`), edge functions use mock data for testing
  - In production mode, edge functions should use real data processing

To configure environment variables for Supabase Edge Functions:
```sh
# For local development
supabase secrets set DENO_ENV=development

# For production deployment  
supabase secrets set DENO_ENV=production
```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fc9a50c5-6c20-4e01-84b9-97b89b1ecfa8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fc9a50c5-6c20-4e01-84b9-97b89b1ecfa8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
