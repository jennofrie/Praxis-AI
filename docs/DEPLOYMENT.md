# Deployment Guide

> Comprehensive deployment documentation for Praxis AI

**Developed by**: JD Digital Systems
**Last Updated**: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Development Deployment](#development-deployment)
5. [Staging Deployment](#staging-deployment)
6. [Production Deployment](#production-deployment)
7. [Database Migrations](#database-migrations)
8. [Environment Variables](#environment-variables)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring & Health Checks](#monitoring--health-checks)
11. [Rollback Procedures](#rollback-procedures)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Praxis AI uses a multi-environment deployment strategy to ensure quality and reliability:

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live user environment

### Deployment Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
├── Run Tests
├── Build Application
├── Security Scans
└── Deploy
    ├── Staging (Auto)
    └── Production (Manual Approval)
```

---

## Prerequisites

### Required Tools

- **Node.js**: 20.x or higher
- **npm** or **pnpm**: Latest version
- **Git**: Latest version
- **Docker**: 24.x or higher (optional, for local development)
- **AWS CLI**: Latest version (for production deployments)
- **Vercel CLI**: Latest version (for Vercel deployments)

### Access Requirements

- GitHub repository access
- AWS account with appropriate IAM permissions
- Vercel account (if using Vercel)
- Database credentials
- API keys for third-party services (Claude API, etc.)

---

## Environment Setup

### Local Environment

1. **Clone Repository**
   ```bash
   git clone https://github.com/jd-digital-systems/praxis-ai.git
   cd praxis-ai/praxis-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

4. **Initialize Database**
   ```bash
   npm run db:migrate:dev
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Access at: http://localhost:3000

---

## Development Deployment

### Docker Development Environment

For consistent development environments:

1. **Create Docker Compose File**
   ```yaml
   # docker-compose.yml
   version: '3.8'

   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=development
         - DATABASE_URL=postgresql://postgres:password@db:5432/spectra
       volumes:
         - .:/app
         - /app/node_modules
       depends_on:
         - db
         - redis

     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=spectra
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

     redis:
       image: redis:7
       ports:
         - "6379:6379"

   volumes:
     postgres_data:
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Run Migrations**
   ```bash
   docker-compose exec app npm run db:migrate:dev
   ```

---

## Staging Deployment

### Vercel Staging (Recommended)

Staging automatically deploys from the `develop` branch.

1. **Configure Vercel Project**
   ```bash
   vercel link
   ```

2. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add ANTHROPIC_API_KEY production
   # Add all required environment variables
   ```

3. **Deploy**
   ```bash
   # Automatic deployment on push to develop
   git push origin develop

   # Or manual deployment
   vercel --prod
   ```

### AWS Staging

For self-hosted staging on AWS:

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy to ECS**
   ```bash
   aws ecs update-service \
     --cluster spectra-staging \
     --service praxis-ai \
     --force-new-deployment
   ```

### Staging Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] QA testing completed
- [ ] Performance testing completed
- [ ] Security scans passed

---

## Production Deployment

### Pre-Deployment Checklist

#### Code Quality
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation updated

#### Infrastructure
- [ ] Database backup completed
- [ ] Monitoring alerts configured
- [ ] Load balancers healthy
- [ ] SSL certificates valid
- [ ] DNS records configured

#### Communication
- [ ] Deployment notification sent
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan prepared
- [ ] On-call team notified

### Deployment Process

#### Option 1: Vercel Production

1. **Create Production Branch**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Navigate to Vercel dashboard
   - Select production deployment
   - Click "Deploy"
   - Monitor deployment progress

#### Option 2: AWS Production (Self-Hosted)

1. **Build Docker Image**
   ```bash
   # Build image
   docker build -t praxis-ai:${VERSION} .

   # Tag for ECR
   docker tag praxis-ai:${VERSION} \
     ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/praxis-ai:${VERSION}

   # Push to ECR
   docker push ${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/praxis-ai:${VERSION}
   ```

2. **Update ECS Service**
   ```bash
   # Update task definition
   aws ecs register-task-definition \
     --cli-input-json file://task-definition.json

   # Update service
   aws ecs update-service \
     --cluster spectra-production \
     --service praxis-ai \
     --task-definition praxis-ai:${VERSION}
   ```

3. **Monitor Deployment**
   ```bash
   # Watch service status
   aws ecs describe-services \
     --cluster spectra-production \
     --services praxis-ai
   ```

### Blue-Green Deployment (Zero Downtime)

1. **Deploy Green Environment**
   ```bash
   # Deploy new version to green environment
   aws ecs update-service \
     --cluster spectra-production \
     --service praxis-ai-green \
     --task-definition praxis-ai:${VERSION}
   ```

2. **Run Smoke Tests**
   ```bash
   npm run test:smoke -- --env=green
   ```

3. **Switch Traffic**
   ```bash
   # Update load balancer to point to green
   aws elbv2 modify-rule \
     --rule-arn ${RULE_ARN} \
     --actions TargetGroupArn=${GREEN_TARGET_GROUP}
   ```

4. **Monitor & Verify**
   - Check error rates
   - Monitor performance metrics
   - Verify user traffic

5. **Decommission Blue** (after 24 hours)
   ```bash
   aws ecs update-service \
     --cluster spectra-production \
     --service praxis-ai-blue \
     --desired-count 0
   ```

---

## Database Migrations

### Migration Strategy

Praxis AI uses **Supabase CLI** for database migrations. Migrations live in `supabase/migrations/` and are numbered sequentially (`NNN_description.sql`).

| Migration | Description |
|-----------|-------------|
| 001–006 | Core schema: profiles, participants, sessions, reports, audit_logs, ndis_plans |
| 007 | AI usage tracking (`ai_usage` table) |
| 008–010 | Reports, synthesized reports, additional indexes |
| 011 | Presence system: `profiles.last_seen`, `profiles.organization_details`, `ai_rate_limits` table |

### Creating a New Migration

```bash
# Create a new migration file
npx supabase migration new descriptive_name

# Edit the generated file in supabase/migrations/
```

### Applying Migrations

#### Remote (linked project)
```bash
# Push all pending migrations to remote Supabase
npx supabase db push

# Push including migrations that failed history check
npx supabase db push --include-all

# Repair migration history if version conflict occurs
npx supabase migration repair <version> --status reverted
npx supabase migration repair <version> --status applied
```

#### Seeding Data
```bash
# The seed.sql file is idempotent — checks for existing data before inserting
# Execute via Supabase Management API or SQL editor in dashboard:
# Dashboard → SQL Editor → paste contents of supabase/seed.sql → Run
```

### Migration Best Practices

```sql
-- ✅ GOOD: Add nullable column
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ✅ GOOD: Add column with default
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- ✅ GOOD: Always add RLS policies for new tables
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own rows" ON new_table
  FOR ALL USING (auth.uid() = user_id);
```

### Migration Best Practices

#### Safe Migrations
```sql
-- ✅ GOOD: Add nullable column
ALTER TABLE participants
ADD COLUMN email VARCHAR(255);

-- ✅ GOOD: Add column with default
ALTER TABLE participants
ADD COLUMN status VARCHAR(50) DEFAULT 'active';

-- ⚠️ RISKY: Add non-nullable without default
ALTER TABLE participants
ADD COLUMN required_field VARCHAR(255) NOT NULL;
-- Better: Add as nullable first, populate, then add constraint
```

#### Multi-Step Migrations

For breaking changes, use multi-step approach:

**Step 1: Add new column**
```sql
ALTER TABLE reports
ADD COLUMN content_v2 JSONB;
```

**Step 2: Backfill data**
```sql
UPDATE reports
SET content_v2 = content::JSONB
WHERE content_v2 IS NULL;
```

**Step 3: Switch application code** (deploy new version)

**Step 4: Remove old column**
```sql
ALTER TABLE reports
DROP COLUMN content;
```

### Rolling Back Migrations

```bash
# Revert last migration
npm run db:migrate:rollback

# Revert to specific migration
npm run db:migrate:rollback -- --to 20260125_add_participant_notes
```

---

## Environment Variables

### Required Variables

All environment variables live in `.env` (never commit this file). See `.env.example` for the full template.

#### Supabase (required)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### AI Services (required for AI assistant)
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
# Model tier: Gemini 2.5 Pro (primary) → 2.0 Flash (fallback)
```

#### Optional (future)
```bash
# Upstash Redis — if added, rate limiter uses sliding window instead of DB fallback
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Managing Secrets

#### AWS Secrets Manager
```bash
# Store secret
aws secretsmanager create-secret \
  --name spectra/prod/database-url \
  --secret-string "postgresql://..."

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id spectra/prod/database-url \
  --query SecretString \
  --output text
```

#### Vercel Secrets
```bash
# Add secret
vercel env add DATABASE_URL production

# Pull secrets to local
vercel env pull .env.local
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy-staging:
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.praxis-ai.com
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      storage: await checkStorage(),
    },
  };

  const isHealthy = Object.values(checks.checks).every(c => c === 'healthy');

  return Response.json(checks, {
    status: isHealthy ? 200 : 503,
  });
}
```

### Monitoring Alerts

Configure alerts for:
- Error rate > 1%
- Response time > 2s (p95)
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Failed health checks

---

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Rollback last migration
npm run db:migrate:rollback

# Restore from backup
pg_restore -h localhost -U postgres -d spectra backup.dump
```

### Full Rollback Procedure

1. **Identify Issue**: Determine root cause
2. **Notify Team**: Alert on-call team
3. **Stop Deployment**: Cancel ongoing deployments
4. **Rollback Application**: Revert to previous version
5. **Rollback Database**: If needed, restore from backup
6. **Verify**: Run smoke tests
7. **Communicate**: Update status page
8. **Post-Mortem**: Document incident

---

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache
rm -rf .next node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

#### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check pool status
npm run db:pool-status
```

#### Deployment Stuck

```bash
# Check logs
vercel logs
# or
aws logs tail /aws/ecs/praxis-ai

# Force new deployment
vercel --force
# or
aws ecs update-service --force-new-deployment
```

---

## Support

### Deployment Issues
- **Email**: devops@jddigitalsystems.com
- **Slack**: #deployments channel
- **On-Call**: See PagerDuty schedule

### Emergency Contacts
- **On-Call Engineer**: See PagerDuty
- **Engineering Lead**: lead@jddigitalsystems.com
- **CTO**: cto@jddigitalsystems.com

---

**Last Updated**: February 2026
**Maintained by**: JD Digital Systems DevOps Team
