# System Architecture

> Comprehensive architectural documentation for Praxis AI

**Designed by**: JD Digital Systems
**Last Updated**: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Components](#system-components)
4. [Data Architecture](#data-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [AI Integration](#ai-integration)
8. [Security Architecture](#security-architecture)
9. [Scalability Strategy](#scalability-strategy)
10. [Deployment Architecture](#deployment-architecture)
11. [Monitoring & Observability](#monitoring--observability)

---

## Overview

Praxis AI is designed as a modern, cloud-native application with a focus on scalability, security, and maintainability. The system follows a **hybrid architecture** combining Server-Side Rendering (SSR), Client-Side Rendering (CSR), and API-based services.

### Key Design Goals

- **Scalability**: Support 1,000+ concurrent users with sub-second response times
- **Security**: Healthcare-grade data protection and compliance
- **Reliability**: 99.9% uptime SLA with graceful degradation
- **Maintainability**: Modular design enabling rapid feature development
- **Performance**: Optimized for low-bandwidth and mobile environments

---

## Architecture Principles

### 1. Separation of Concerns
- **Presentation Layer**: React components and UI logic
- **Business Logic Layer**: Server Actions and API routes
- **Data Layer**: Database access and external integrations
- **AI/ML Layer**: Isolated AI processing services

### 2. Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experiences for modern browsers
- Graceful degradation for older clients

### 3. Security by Design
- Zero-trust security model
- Defense in depth strategy
- Principle of least privilege
- Secure by default configurations

### 4. API-First Development
- All features accessible via API
- Versioned API endpoints
- Comprehensive API documentation
- Rate limiting and throttling

### 5. Data Sovereignty
- Compliance with Australian privacy laws
- Data residency in Australian regions
- Encryption at rest and in transit
- Audit logging for all data access

---

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        End Users                                 │
│            (Web Browsers, Mobile Apps, API Clients)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CDN / Edge Network                           │
│                    (Vercel Edge, CloudFlare)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   App Router │  │    Server    │  │   API Routes │         │
│  │   (SSR/RSC)  │  │   Actions    │  │   (REST)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Database   │    │  AI Services │    │   External   │
│  (PostgreSQL)│    │   (ML/LLM)   │    │     APIs     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │   Logging &  │
                    │  Monitoring  │
                    └──────────────┘
```

### Component Descriptions

#### 1. **Frontend Layer** (Next.js App)
- **Technology**: Next.js 16+, React 19, TypeScript
- **Responsibilities**:
  - Server-side rendering for SEO and performance
  - Client-side interactivity and real-time updates
  - Form handling and validation
  - State management
- **Deployment**: Vercel Edge Network (development/staging), AWS CloudFront (production)

#### 2. **Application Layer** (Server Components + API)
- **Server Components**: Data fetching, authentication, authorization
- **Server Actions**: Form submissions, mutations, background jobs
- **API Routes**: RESTful endpoints for external integrations
- **Deployment**: Serverless functions (Vercel) or containers (AWS ECS)

#### 3. **Database Layer** (PostgreSQL)
- **Primary Database**: PostgreSQL 15+ with PostGIS extension
- **Read Replicas**: For reporting and analytics queries
- **Caching**: Redis for session storage and query caching
- **Deployment**: AWS RDS with Multi-AZ deployment

#### 4. **AI/ML Layer**
- **LLM Services**: Claude API (Anthropic) for report generation
- **ML Models**: Custom models for clinical data analysis
- **Vector Database**: Pinecone/Weaviate for semantic search
- **Job Queue**: Bull/BullMQ for async AI processing

#### 5. **Storage Layer**
- **File Storage**: AWS S3 for documents, images, reports
- **CDN**: CloudFront for static asset delivery
- **Backup**: Automated daily backups with 30-day retention

#### 6. **Monitoring & Observability**
- **Application Monitoring**: Datadog/New Relic
- **Error Tracking**: Sentry
- **Logging**: CloudWatch Logs or Datadog
- **Uptime Monitoring**: Pingdom/StatusCake

---

## Data Architecture

### Database Schema Overview

```sql
-- Core Entities
Users
  ├── Organizations (Multi-tenancy)
  ├── Participants
  │   ├── Sessions
  │   ├── Reports (AI-generated)
  │   ├── Documents
  │   └── NDIS Plans
  ├── Audit Logs
  └── API Keys

-- Supporting Entities
Templates
AI Processing Queue
Notifications
System Settings
```

### Key Tables

#### Users
```typescript
interface User {
  id: string;               // UUID
  email: string;            // Unique, indexed
  firstName: string;
  lastName: string;
  role: 'admin' | 'clinician' | 'viewer';
  organizationId: string;   // Foreign key
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
```

#### Participants
```typescript
interface Participant {
  id: string;               // UUID
  organizationId: string;   // Multi-tenancy
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  ndisNumber: string;       // Unique, indexed, encrypted
  status: 'active' | 'inactive' | 'pending';
  assignedClinician: string; // Foreign key to Users
  createdAt: Date;
  updatedAt: Date;
}
```

#### Reports
```typescript
interface Report {
  id: string;               // UUID
  participantId: string;    // Foreign key
  type: 'session_note' | 'assessment' | 'progress_report' | 'ndis_plan';
  content: string;          // Rich text JSON
  aiConfidence: number;     // 0-100
  status: 'draft' | 'review' | 'approved' | 'archived';
  generatedBy: 'ai' | 'manual';
  reviewedBy: string | null; // Foreign key to Users
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
}
```

### Data Access Patterns

#### High-Frequency Queries
- Participant list with filters (dashboard)
- Recent reports for a participant
- User authentication and authorization
- Dashboard analytics aggregations

#### Optimization Strategies
- **Indexes**: Composite indexes on frequently queried columns
- **Partitioning**: Time-based partitioning for audit logs and reports
- **Caching**: Redis cache for user sessions, frequently accessed data
- **Read Replicas**: Route analytics queries to read replicas

---

## Frontend Architecture

### Component Hierarchy

```
app/
├── layout.tsx                 # Root layout (auth, theme provider)
├── (dashboard)/              # Dashboard route group
│   ├── layout.tsx           # Dashboard layout (sidebar, header)
│   ├── page.tsx             # Dashboard home
│   ├── participants/
│   │   ├── page.tsx         # Participant list
│   │   └── [id]/
│   │       ├── page.tsx     # Participant details
│   │       └── reports/
│   │           └── [reportId]/page.tsx
│   ├── reports/
│   ├── ai-assistant/
│   └── settings/
└── (auth)/                   # Auth route group
    ├── login/
    └── register/
```

### State Management Strategy

#### Server State
- **React Server Components**: Default for data fetching
- **Server Actions**: For mutations and form handling
- **Streaming**: Progressive rendering for large datasets

#### Client State
- **React Context**: Theme, user preferences, UI state
- **URL State**: Filters, pagination, search queries
- **Local State**: Form inputs, temporary UI state

#### Cache Strategy
- **Next.js Cache**: Automatic caching for Server Components
- **SWR/React Query**: Client-side data synchronization
- **Redis Cache**: Server-side caching for expensive queries

### Design System

#### Color Palette
```typescript
const colors = {
  primary: '#4F46E5',         // Indigo-600
  primaryLight: '#E0E7FF',
  backgroundLight: '#F3F4F6',
  backgroundDark: '#0F172A',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1E293B',
  // ... (see CLAUDE.md for full palette)
};
```

#### Component Library
- **Base Components**: `components/ui/` (Button, Input, Card, etc.)
- **Feature Components**: `components/features/` (ParticipantCard, ReportCard)
- **Layout Components**: `components/layouts/` (Sidebar, Header)
- **Utility Components**: `components/utils/` (ErrorBoundary, Loading)

---

## Backend Architecture

### API Design

#### RESTful Endpoints
```
GET    /api/participants              # List participants
POST   /api/participants              # Create participant
GET    /api/participants/:id          # Get participant
PATCH  /api/participants/:id          # Update participant
DELETE /api/participants/:id          # Delete participant

GET    /api/participants/:id/reports  # List reports
POST   /api/participants/:id/reports  # Generate report
GET    /api/reports/:id                # Get report
PATCH  /api/reports/:id                # Update report
POST   /api/reports/:id/approve       # Approve report
```

#### Server Actions (Next.js)
```typescript
// app/actions/participants.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createParticipant(formData: FormData) {
  // Validate input
  const validated = participantSchema.parse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    // ...
  });

  // Check authorization
  const user = await getUser();
  if (!user) throw new UnauthorizedError();

  // Create participant
  const participant = await db.participant.create({
    data: { ...validated, organizationId: user.organizationId },
  });

  // Revalidate cache
  revalidatePath('/participants');

  return { success: true, data: participant };
}
```

### Authentication & Authorization

#### Authentication Flow
1. User submits credentials
2. Server validates credentials against database
3. JWT token issued with user ID, role, organization
4. Token stored in HTTP-only cookie
5. Subsequent requests validated via middleware

#### Authorization Model
- **Role-Based Access Control (RBAC)**
  - Admin: Full access to organization data
  - Clinician: Access to assigned participants
  - Viewer: Read-only access

- **Resource-Level Permissions**
  - Participants: Ownership by organization + assigned clinician
  - Reports: Created by user or organization member
  - Settings: Admin only

---

## AI Integration

### AI-Powered Report Generation

#### Architecture
```
User Request → Queue Job → AI Service → Generate Report → Review Queue → Approval → Storage
```

#### Implementation
```typescript
// AI Report Generation Flow
async function generateReport(participantId: string, type: ReportType) {
  // 1. Fetch participant data
  const participant = await getParticipant(participantId);
  const history = await getSessionHistory(participantId);

  // 2. Build prompt
  const prompt = buildReportPrompt(participant, history, type);

  // 3. Call AI service
  const aiResponse = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  // 4. Parse and validate response
  const report = parseAIReport(aiResponse);
  const confidence = calculateConfidence(report);

  // 5. Save draft report
  return await saveReport({
    participantId,
    type,
    content: report.content,
    aiConfidence: confidence,
    status: confidence > 85 ? 'review' : 'draft',
  });
}
```

#### Confidence Scoring
- **95-100%**: High confidence, minimal review needed
- **85-94%**: Medium confidence, standard review
- **< 85%**: Low confidence, detailed review required

#### Human-in-the-Loop
- All AI-generated reports require human review
- Reviewers can edit, approve, or reject reports
- Feedback loop improves AI model over time

---

## Security Architecture

### Security Layers

#### 1. Network Security
- **HTTPS Only**: TLS 1.3 for all connections
- **CORS**: Strict origin policies
- **Rate Limiting**: Per-IP and per-user limits
- **DDoS Protection**: CloudFlare or AWS Shield

#### 2. Application Security
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries (Prisma ORM)
- **XSS Prevention**: React's built-in escaping + CSP headers
- **CSRF Protection**: SameSite cookies + CSRF tokens

#### 3. Data Security
- **Encryption at Rest**: AES-256 for database and S3
- **Encryption in Transit**: TLS 1.3
- **PII Encryption**: Sensitive fields (NDIS numbers) encrypted with field-level encryption
- **Key Management**: AWS KMS for encryption keys

#### 4. Authentication Security
- **Password Hashing**: Argon2id with salts
- **MFA**: TOTP-based two-factor authentication
- **Session Management**: HTTP-only, secure cookies with 24-hour expiry
- **Account Lockout**: After 5 failed attempts

#### 5. Audit & Compliance
- **Audit Logging**: All data access and modifications logged
- **Log Retention**: 7 years for compliance
- **Privacy**: GDPR/Australian Privacy Principles compliance
- **NDIS Compliance**: Quality and Safeguards Commission requirements

---

## Scalability Strategy

### Horizontal Scaling

#### Application Tier
- **Stateless Servers**: No session state on servers
- **Load Balancing**: AWS ALB or Vercel Edge
- **Auto-Scaling**: Scale based on CPU, memory, request rate
- **Target**: 100+ concurrent application servers

#### Database Tier
- **Read Replicas**: 3-5 replicas for read-heavy workloads
- **Connection Pooling**: PgBouncer with 1000+ connections
- **Partitioning**: Time-based partitioning for large tables
- **Sharding**: Organization-based sharding (future)

### Vertical Scaling

#### Database Optimization
- **Indexes**: Composite indexes on query patterns
- **Query Optimization**: EXPLAIN ANALYZE for slow queries
- **Materialized Views**: For complex analytics queries
- **Vacuum**: Regular maintenance tasks

#### Caching Strategy
- **L1 Cache**: React Server Components cache (short TTL)
- **L2 Cache**: Redis cache (medium TTL)
- **L3 Cache**: CDN cache for static assets (long TTL)

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2 seconds | Lighthouse, Web Vitals |
| API Response | < 500ms (p95) | Application monitoring |
| Database Queries | < 100ms (p95) | Query logging |
| AI Report Generation | < 30 seconds | Job queue metrics |
| Concurrent Users | 1,000+ | Load testing |
| Uptime | 99.9% | Uptime monitoring |

---

## Deployment Architecture

### Environments

#### 1. **Development**
- **Purpose**: Local development and testing
- **Infrastructure**: Local Docker containers
- **Database**: SQLite or local PostgreSQL
- **AI Services**: Mock responses or development API keys

#### 2. **Staging**
- **Purpose**: Pre-production testing and QA
- **Infrastructure**: Vercel preview deployments
- **Database**: AWS RDS (smaller instance)
- **AI Services**: Separate API keys with rate limits

#### 3. **Production**
- **Purpose**: Live user traffic
- **Infrastructure**: AWS (multi-region) or Vercel Enterprise
- **Database**: AWS RDS Multi-AZ with read replicas
- **AI Services**: Production API keys with full capacity

### Deployment Pipeline

```
Code Push → GitHub Actions
  ├── Run Tests (Jest, Playwright)
  ├── Type Check (TypeScript)
  ├── Lint (ESLint)
  ├── Build (Next.js)
  ├── Security Scan (Snyk)
  └── Deploy
       ├── Staging (auto-deploy from main)
       └── Production (manual approval)
```

### Database Migrations

```bash
# Development
npm run db:migrate:dev

# Staging/Production
npm run db:migrate:deploy

# Rollback
npm run db:migrate:rollback
```

### Disaster Recovery

- **Backups**: Automated daily backups with point-in-time recovery
- **Recovery Time Objective (RTO)**: < 4 hours
- **Recovery Point Objective (RPO)**: < 1 hour
- **Multi-Region**: Standby environment in separate AWS region

---

## Monitoring & Observability

### Application Monitoring

#### Metrics to Track
- **Performance**: Response times, throughput, error rates
- **Usage**: Active users, feature adoption, session duration
- **Infrastructure**: CPU, memory, disk, network utilization
- **Business**: Reports generated, participants active, revenue

#### Tools
- **Application Performance Monitoring (APM)**: Datadog or New Relic
- **Error Tracking**: Sentry with source maps
- **Log Aggregation**: CloudWatch Logs or Datadog
- **Uptime Monitoring**: Pingdom or StatusCake
- **Real User Monitoring (RUM)**: Vercel Analytics or Datadog RUM

### Alerting Strategy

#### Critical Alerts (PagerDuty, 24/7)
- API error rate > 5%
- Database connection failures
- AI service downtime
- Security incidents

#### Warning Alerts (Slack, business hours)
- API response time > 1s (p95)
- Database replica lag > 10 seconds
- Disk utilization > 80%
- Unusual traffic patterns

### Logging Standards

```typescript
// Structured logging
logger.info('Report generated', {
  reportId: report.id,
  participantId: participant.id,
  userId: user.id,
  organizationId: user.organizationId,
  type: report.type,
  aiConfidence: report.aiConfidence,
  duration: performance.now() - startTime,
});
```

---

## Future Architecture Considerations

### Phase 1: Current (MVP - 100 users)
- Monolithic Next.js application
- Single PostgreSQL database
- Basic AI integration
- Manual scaling

### Phase 2: Growth (1,000 users)
- **Caching Layer**: Redis for session and query caching
- **Read Replicas**: Separate read traffic from writes
- **CDN**: CloudFront for global asset delivery
- **Monitoring**: Comprehensive APM and alerting

### Phase 3: Scale (10,000+ users)
- **Microservices**: Separate AI service, reporting service
- **Database Sharding**: Organization-based sharding
- **Message Queue**: RabbitMQ/SQS for async processing
- **Multi-Region**: Deploy to multiple AWS regions

### Phase 4: Enterprise (100,000+ users)
- **Event-Driven Architecture**: CQRS pattern with event sourcing
- **GraphQL Federation**: Unified API layer
- **Advanced AI**: Custom ML models, real-time predictions
- **Edge Computing**: Cloudflare Workers for global performance

---

## Architecture Decision Records (ADRs)

### ADR-001: Next.js App Router
**Decision**: Use Next.js 13+ with App Router (React Server Components)
**Rationale**: Better performance, simpler data fetching, reduced client-side JavaScript
**Consequences**: Requires learning new patterns, limited library support initially

### ADR-002: PostgreSQL Database
**Decision**: Use PostgreSQL as primary database
**Rationale**: ACID compliance, rich ecosystem, JSON support, full-text search
**Consequences**: Need to manage scaling, replication, backups

### ADR-003: Claude AI for Report Generation
**Decision**: Use Anthropic Claude API for AI-powered reports
**Rationale**: High-quality output, strong reasoning, healthcare-appropriate responses
**Consequences**: API costs, dependency on third-party service, rate limits

### ADR-004: Tailwind CSS
**Decision**: Use Tailwind CSS for styling
**Rationale**: Rapid development, consistency, small bundle size, design system integration
**Consequences**: Verbose className strings, learning curve

---

## Contributing to Architecture

Architecture changes require:

1. **Proposal**: Document proposed change with rationale
2. **Review**: Technical review by senior engineers
3. **ADR**: Create Architecture Decision Record
4. **Implementation**: Gradual rollout with monitoring
5. **Documentation**: Update this document

**Questions?** Contact the architecture team at architecture@jddigitalsystems.com

---

**Maintained by**: JD Digital Systems Architecture Team
**Document Version**: 1.0.0
**Last Updated**: January 2026
