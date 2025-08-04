# Production Environment Configuration
# This file documents the required environment variables and configurations for production deployment

## Critical Environment Variables

### Core Application
NODE_ENV=production
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key

### Edge Functions Environment Detection
DENO_ENV=production
DEVELOPMENT_MODE=false

### Security Configuration
# Disable debug mode in production
DEBUG_MODE=false
VITE_DEBUG_ENABLED=false

# Rate limiting (if using a reverse proxy like nginx)
# RATE_LIMIT_REQUESTS_PER_MINUTE=60
# RATE_LIMIT_BURST=10

### Performance Optimization
# Enable caching (configure in your CDN/proxy)
# CACHE_STATIC_ASSETS=true
# CACHE_MAX_AGE=31536000  # 1 year for static assets
# CACHE_API_MAX_AGE=300   # 5 minutes for API responses

### Database Configuration
# Ensure connection pooling is configured in Supabase
# MAX_DB_CONNECTIONS=20
# DB_POOL_SIZE=10

### Monitoring and Logging
# Configure application monitoring
# SENTRY_DSN=your_sentry_dsn
# LOG_LEVEL=error  # Only log errors in production
# ANALYTICS_ENABLED=true

## Required Supabase Configuration

### Row Level Security (RLS)
# Ensure all tables have RLS enabled:
# - user_roles
# - client_configurations  
# - financial_data
# - user_profiles
# - excel_files
# - data_quality_logs
# - data_mapping_rules

### Database Indexes
# Apply the production_performance_indexes.sql migration for:
# - idx_financial_data_company_year
# - idx_user_roles_user_id
# - idx_client_configurations_user_id
# And additional performance indexes

### Backup Configuration
# Enable automated backups in Supabase Dashboard:
# - Daily backups with 7-day retention minimum
# - Point-in-time recovery enabled
# - Cross-region backup replication (recommended)

## CDN and Static Asset Configuration

### Recommended CDN Settings
# Cache Control Headers:
# - Static assets (JS, CSS, images): max-age=31536000, immutable
# - HTML files: max-age=0, must-revalidate
# - API responses: max-age=300, stale-while-revalidate=60

### Compression
# Enable gzip/brotli compression for:
# - JavaScript files (.js)
# - CSS files (.css)  
# - JSON responses
# - HTML files

## Security Best Practices

### HTTPS Configuration
# Ensure all traffic uses HTTPS
# Configure HSTS headers
# Use secure cookie settings

### Content Security Policy (CSP)
# Configure CSP headers to prevent XSS attacks
# Example CSP for Vite React app:
# Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;

### CORS Configuration
# Configure CORS properly in Supabase for your domain
# Avoid wildcards (*) in production

## Performance Monitoring

### Key Metrics to Monitor
# - Page load times (target: <3 seconds)
# - Database query performance (target: <200ms for typical queries)
# - Error rates (target: <1%)
# - API response times (target: <500ms)
# - User authentication success rates

### Recommended Monitoring Tools
# - Supabase built-in monitoring
# - Google Analytics or similar for user metrics
# - Sentry for error tracking
# - Lighthouse CI for performance monitoring

## Deployment Checklist

### Pre-deployment
# ✓ Run production build successfully
# ✓ All tests pass
# ✓ Security audit completed
# ✓ Database migrations applied
# ✓ Environment variables configured
# ✓ CDN configuration tested

### Post-deployment
# ✓ Health checks pass
# ✓ Authentication flow works
# ✓ Database queries perform well
# ✓ Error tracking is working
# ✓ Backup systems are active
# ✓ Monitoring dashboards are functional

## Maintenance

### Regular Tasks
# - Weekly: Review error logs and performance metrics
# - Monthly: Update dependencies and security patches
# - Quarterly: Database performance review and optimization
# - Annually: Security audit and penetration testing