# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fc9a50c5-6c20-4e01-84b9-97b89b1ecfa8

## 🧪 Testing and Validation

This project includes a comprehensive testing and validation system designed for production readiness.

### Available Test Scripts

#### Core Testing Commands
```sh
# Run all unit and integration tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run end-to-end tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

#### Validation Scripts
```sh
# Comprehensive stability check for production readiness
npm run stability-check

# Pre-deployment validation (includes stability check + build)
npm run pre-deploy

# Validate authentication system
npm run validate:auth

# Validate navigation and routing
npm run validate:navigation

# Validate error recovery and resilience
npm run validate:recovery

# Run all validation checks
npm run validate:all
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
