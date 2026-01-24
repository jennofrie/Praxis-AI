# Security Policy

> Security policies and vulnerability reporting for Praxis AI

**Maintained by**: JD Digital Systems Security Team

---

## Table of Contents

1. [Supported Versions](#supported-versions)
2. [Reporting a Vulnerability](#reporting-a-vulnerability)
3. [Security Update Process](#security-update-process)
4. [Security Best Practices](#security-best-practices)
5. [Compliance & Standards](#compliance--standards)
6. [Data Protection](#data-protection)
7. [Access Control](#access-control)
8. [Incident Response](#incident-response)

---

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.x.x   | :white_check_mark: | TBD            |
| 0.4.x   | :white_check_mark: | June 2026      |
| 0.3.x   | :white_check_mark: | March 2026     |
| 0.2.x   | :x:                | Ended          |
| 0.1.x   | :x:                | Ended          |

**Note**: Security patches are backported to supported versions for critical and high-severity vulnerabilities only.

---

## Reporting a Vulnerability

### How to Report

If you discover a security vulnerability in Praxis AI, please report it responsibly:

**DO NOT** create a public GitHub issue for security vulnerabilities.

#### Preferred Method: Security Email
Send details to: **security@jddigitalsystems.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

#### Alternative Method: Encrypted Communication
For highly sensitive issues, use our PGP key:
```
Key ID: [To be added]
Fingerprint: [To be added]
```

### What to Expect

1. **Acknowledgment**: Within 24 hours
2. **Initial Assessment**: Within 48 hours
3. **Status Updates**: Every 3-5 business days
4. **Resolution Timeline**:
   - Critical: 24-48 hours
   - High: 7 days
   - Medium: 30 days
   - Low: Next minor release

### Responsible Disclosure

We request that you:
- Give us reasonable time to address the issue before public disclosure
- Do not exploit the vulnerability beyond proof-of-concept
- Do not access, modify, or delete data belonging to others
- Act in good faith to avoid privacy violations

### Recognition

We appreciate security researchers and offer:
- Public acknowledgment (if desired)
- Inclusion in our security hall of fame
- Potential monetary rewards (for critical findings)

---

## Security Update Process

### Severity Classification

#### Critical (CVSS 9.0-10.0)
- Remote code execution
- SQL injection
- Authentication bypass
- Data breach exposing sensitive information

**Response**: Immediate hotfix, deployed within 24 hours

#### High (CVSS 7.0-8.9)
- Privilege escalation
- Cross-site scripting (XSS)
- Insecure direct object references
- Sensitive data exposure

**Response**: Patch within 7 days

#### Medium (CVSS 4.0-6.9)
- CSRF vulnerabilities
- Information disclosure
- Weak cryptography
- Security misconfiguration

**Response**: Patch in next minor release (typically 2-4 weeks)

#### Low (CVSS 0.1-3.9)
- Non-exploitable bugs
- Defense-in-depth improvements
- Low-impact information leaks

**Response**: Patch in next major/minor release

### Update Distribution

1. **Security Advisory**: Published on GitHub Security Advisories
2. **Email Notification**: Sent to registered users
3. **Changelog**: Updated with security fix details
4. **Deployment**: Automatic for cloud-hosted, manual for self-hosted

---

## Security Best Practices

### For Developers

#### Authentication & Authorization
```typescript
// ✅ GOOD: Proper authentication check
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Proceed with authenticated request
}

// ❌ BAD: Trusting client-side headers
export async function GET(request: Request) {
  const userId = request.headers.get('X-User-ID');
  // NEVER trust client-provided user identifiers!
}
```

#### Input Validation
```typescript
// ✅ GOOD: Validate all inputs
import { z } from 'zod';

const participantSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  ndisNumber: z.string().regex(/^\d{9}$/),
  email: z.string().email(),
});

export async function createParticipant(data: unknown) {
  // Validate before processing
  const validated = participantSchema.parse(data);
  // ...
}

// ❌ BAD: No validation
export async function createParticipant(data: any) {
  // Direct use of unvalidated data
  const result = await db.insert(data);
}
```

#### SQL Injection Prevention
```typescript
// ✅ GOOD: Parameterized queries (using Prisma)
const participant = await prisma.participant.findUnique({
  where: { id: participantId },
});

// ❌ BAD: String concatenation
const query = `SELECT * FROM participants WHERE id = '${participantId}'`;
// NEVER concatenate user input into SQL queries!
```

#### XSS Prevention
```typescript
// ✅ GOOD: React automatically escapes
<div>{userInput}</div>

// ⚠️ DANGEROUS: Only use when absolutely necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedInput }} />

// Must sanitize with DOMPurify or similar
import DOMPurify from 'isomorphic-dompurify';
const sanitized = DOMPurify.sanitize(userInput);
```

#### Secrets Management
```typescript
// ✅ GOOD: Environment variables
const apiKey = process.env.ANTHROPIC_API_KEY;

// ❌ BAD: Hardcoded secrets
const apiKey = 'sk-ant-123456789'; // NEVER commit secrets!
```

#### CSRF Protection
```typescript
// ✅ GOOD: Using Next.js Server Actions (CSRF-protected)
'use server';

export async function updateParticipant(formData: FormData) {
  // Built-in CSRF protection
}

// ⚠️ API Routes: Use CSRF tokens
import { csrf } from '@/lib/csrf';

export async function POST(request: Request) {
  await csrf.verify(request);
  // ...
}
```

### For Users

#### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot be a common password
- Cannot reuse last 5 passwords

#### Two-Factor Authentication (2FA)
- **Highly Recommended** for all accounts
- Required for admin accounts
- Supported methods: TOTP (Google Authenticator, Authy)

#### Session Security
- Sessions expire after 24 hours of inactivity
- Logout from all devices available
- Notification on new device login

#### Data Access
- Review access logs regularly
- Report suspicious activity immediately
- Use role-based access (least privilege)

---

## Compliance & Standards

### Regulatory Compliance

#### NDIS Quality and Safeguards Commission
- Compliant with NDIS Practice Standards
- Audit logging for all participant data access
- Secure storage of sensitive information
- Regular compliance audits

#### Privacy Act 1988 (Australian Privacy Principles)
- Data collection with consent
- Purpose limitation
- Data quality and accuracy
- Security safeguards
- Access and correction rights
- Anonymity and pseudonymity options

#### Healthcare Data Standards
- ISO 27001 (Information Security Management)
- ISO 27701 (Privacy Information Management)
- OWASP Top 10 mitigation
- SOC 2 Type II compliance (in progress)

### Security Standards

#### OWASP Top 10 Mitigation

| OWASP Risk | Mitigation |
|------------|------------|
| Injection | Parameterized queries, input validation |
| Broken Authentication | Strong password policy, MFA, secure sessions |
| Sensitive Data Exposure | Encryption at rest and in transit, field-level encryption |
| XML External Entities | JSON-only API, no XML processing |
| Broken Access Control | Role-based access, authorization checks |
| Security Misconfiguration | Secure defaults, hardening guides |
| XSS | React escaping, Content Security Policy |
| Insecure Deserialization | Type validation, safe parsers |
| Known Vulnerabilities | Automated dependency scanning |
| Insufficient Logging | Comprehensive audit logging |

---

## Data Protection

### Encryption

#### Data at Rest
- **Database**: AES-256 encryption for all data at rest
- **File Storage**: S3 with server-side encryption (SSE-S3)
- **Sensitive Fields**: Additional field-level encryption for:
  - NDIS numbers
  - Medical information
  - Financial data

#### Data in Transit
- **HTTPS Only**: TLS 1.3 minimum
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate Pinning**: For API clients

#### Key Management
- **AWS KMS**: For encryption key management
- **Key Rotation**: Automatic annual rotation
- **Access Control**: Strict IAM policies

### Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Participant Records | 7 years (regulatory requirement) | Secure deletion |
| Audit Logs | 7 years | Secure deletion |
| Session Data | 30 days | Automatic expiry |
| Backups | 30 days | Encrypted, secure deletion |
| Deleted Records | 90 days (soft delete) | Hard delete after period |

### Data Minimization
- Collect only necessary data
- Regular data audits
- Automatic purging of expired data
- User data export/deletion on request

### Backup Security
- Encrypted backups
- Stored in separate geographic region
- Access restricted to authorized personnel
- Regular restore testing

---

## Access Control

### Role-Based Access Control (RBAC)

#### Admin
- Full access to organization data
- User management
- System configuration
- Audit log access

#### Clinician
- Access to assigned participants
- Create/edit reports
- View analytics for assigned participants
- Limited settings access

#### Viewer
- Read-only access
- View reports and participant summaries
- No edit permissions
- No access to sensitive fields

### Authentication Methods

#### Password Authentication
- Argon2id hashing
- Salt per user
- Minimum password complexity
- Account lockout after 5 failed attempts

#### Two-Factor Authentication (2FA)
- TOTP-based (RFC 6238)
- Backup codes provided
- Required for admin accounts

#### Session Management
- HTTP-only, secure cookies
- 24-hour session expiry
- Sliding session window
- Concurrent session limits

### Authorization Checks

```typescript
// ✅ GOOD: Check authorization for every request
async function getParticipant(id: string, userId: string) {
  // 1. Fetch resource
  const participant = await db.participant.findUnique({ where: { id } });

  if (!participant) {
    throw new NotFoundError();
  }

  // 2. Check authorization
  const hasAccess = await checkAccess(userId, participant.id);

  if (!hasAccess) {
    throw new UnauthorizedError();
  }

  return participant;
}

// ❌ BAD: No authorization check
async function getParticipant(id: string) {
  return await db.participant.findUnique({ where: { id } });
  // Anyone can access any participant!
}
```

---

## Incident Response

### Response Team

- **Security Lead**: Coordinates response
- **Engineering Lead**: Implements fixes
- **Legal Counsel**: Assesses legal obligations
- **Communications**: Handles user communication

### Response Process

#### 1. Detection & Analysis
- Monitor security alerts
- Investigate reported incidents
- Assess severity and impact
- Document findings

#### 2. Containment
- Isolate affected systems
- Prevent further damage
- Preserve evidence
- Notify stakeholders

#### 3. Eradication
- Remove threat
- Patch vulnerabilities
- Verify system integrity
- Update security controls

#### 4. Recovery
- Restore systems from clean backups
- Monitor for re-infection
- Gradual restoration of services
- Verify functionality

#### 5. Post-Incident
- Root cause analysis
- Document lessons learned
- Update security measures
- Compliance notifications (if required)

### Breach Notification

In case of a data breach:
- **Users**: Notified within 72 hours
- **Regulators**: Notified per legal requirements
- **Public Disclosure**: If affecting >500 users

---

## Security Monitoring

### Automated Monitoring

- **Intrusion Detection**: AWS GuardDuty
- **Log Analysis**: CloudWatch Insights
- **Dependency Scanning**: Snyk/Dependabot
- **Code Analysis**: SonarQube
- **Vulnerability Scanning**: Trivy

### Manual Reviews

- **Code Review**: Security review for all PRs
- **Penetration Testing**: Annual third-party testing
- **Security Audits**: Quarterly internal audits
- **Compliance Review**: Annual compliance assessment

### Metrics

- Failed login attempts
- API error rates
- Unusual access patterns
- Database query anomalies
- Resource utilization spikes

---

## Security Training

All team members complete:
- Secure coding training (annual)
- OWASP Top 10 awareness
- Data privacy regulations
- Incident response procedures
- Social engineering awareness

---

## Third-Party Dependencies

### Dependency Management
- Automated weekly scans (Dependabot)
- Security advisories monitoring
- Timely patching of vulnerabilities
- Minimal dependency philosophy

### Vendor Security
- Third-party security assessments
- Contractual security requirements
- Regular vendor reviews
- Data processing agreements

---

## Contact

### Security Team
- **Email**: security@jddigitalsystems.com
- **PGP Key**: [To be added]
- **Response Time**: 24 hours

### Compliance Inquiries
- **Email**: compliance@jddigitalsystems.com

### General Security Questions
- **Email**: info@jddigitalsystems.com

---

## Security Changelog

### 2026-01
- Initial security policy created
- Security monitoring implemented
- Vulnerability disclosure process established

---

**Last Updated**: January 25, 2026
**Next Review**: April 2026
**Maintained by**: JD Digital Systems Security Team

---

*This security policy is a living document and will be updated as our security practices evolve.*
