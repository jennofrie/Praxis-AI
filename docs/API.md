# API Documentation

> Comprehensive API reference for Praxis AI

**Developed by**: JD Digital Systems
**API Version**: 1.0.0
**Last Updated**: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [Request & Response Format](#request--response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [API Endpoints](#api-endpoints)
8. [Webhooks](#webhooks)
9. [SDKs & Client Libraries](#sdks--client-libraries)

---

## Overview

The Praxis AI API provides programmatic access to all platform features. The API follows REST principles and returns JSON responses.

### Key Features

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Format**: All requests and responses use JSON
- **Authentication**: JWT-based authentication with refresh tokens
- **Rate Limiting**: Protects against abuse
- **Versioning**: Stable API versions with migration paths
- **Webhooks**: Real-time event notifications
- **Comprehensive**: Full feature parity with web interface

### API Principles

- **Consistency**: Predictable URL patterns and response structures
- **Documentation**: Every endpoint thoroughly documented
- **Backwards Compatibility**: No breaking changes within major versions
- **Security**: Defense-in-depth approach
- **Performance**: Optimized for low latency

---

## Authentication

### Overview

The API uses JWT (JSON Web Tokens) for authentication. Obtain a token by authenticating with your credentials, then include the token in subsequent requests.

### Obtaining a Token

#### Request
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "clinician"
    }
  }
}
```

### Using the Token

Include the access token in the `Authorization` header:

```http
GET /api/v1/participants
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

Access tokens expire after 1 hour. Use the refresh token to obtain a new access token:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### API Keys (Optional)

For server-to-server integration, use API keys:

```http
GET /api/v1/participants
X-API-Key: sk_live_abc123xyz789
```

---

## Base URL & Versioning

### Base URLs

| Environment | Base URL |
|-------------|----------|
| Production  | `https://api.praxis-ai.com` |
| Staging     | `https://api.staging.praxis-ai.com` |
| Development | `http://localhost:3000` |

### Versioning

The API uses URL-based versioning:

```
https://api.praxis-ai.com/v1/participants
                                  ^^
                                  Version
```

#### Version Policy

- **Major Version** (e.g., v1 → v2): Breaking changes
- **Minor Updates**: New features without breaking changes
- **Deprecation**: 6-month notice before endpoint removal

#### Current Versions

- **v1**: Current stable version (recommended)

---

## Request & Response Format

### Request Format

#### Headers
```http
Content-Type: application/json
Authorization: Bearer {token}
Accept: application/json
```

#### Request Body (POST/PATCH)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "ndisNumber": "123456789"
}
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "participant_123",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2026-01-25T10:30:00Z"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-25T10:30:00Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid NDIS number format",
    "details": [
      {
        "field": "ndisNumber",
        "message": "Must be exactly 9 digits"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-25T10:30:00Z"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no response body |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary server issue |

---

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [] // Optional additional details
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-25T10:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Handling Best Practices

```typescript
// Example: Handling API errors
async function getParticipant(id: string) {
  try {
    const response = await fetch(`/api/v1/participants/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.error.code) {
        case 'RESOURCE_NOT_FOUND':
          console.error('Participant not found');
          break;
        case 'INSUFFICIENT_PERMISSIONS':
          console.error('Access denied');
          break;
        default:
          console.error('API error:', error.error.message);
      }

      throw new Error(error.error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

---

## Rate Limiting

### Limits

| Account Type | Requests per Minute | Requests per Hour |
|--------------|---------------------|-------------------|
| Free         | 60                  | 1,000             |
| Professional | 300                 | 10,000            |
| Enterprise   | 1,000               | Unlimited         |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1643123400
```

### Exceeding Rate Limits

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 30 seconds.",
    "retryAfter": 30
  }
}
```

**Response Code**: `429 Too Many Requests`

---

## API Endpoints

### Participants

#### List Participants

```http
GET /api/v1/participants
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (`active`, `inactive`, `pending`)
- `search` (string): Search by name or NDIS number
- `sort` (string): Sort field (`firstName`, `lastName`, `createdAt`)
- `order` (string): Sort order (`asc`, `desc`)

**Example Request:**
```http
GET /api/v1/participants?page=1&limit=20&status=active&sort=firstName&order=asc
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "participant_123",
      "firstName": "John",
      "lastName": "Doe",
      "ndisNumber": "123456789",
      "status": "active",
      "assignedClinician": {
        "id": "user_456",
        "name": "Dr. Smith"
      },
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-25T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "totalPages": 7
  }
}
```

#### Get Participant

```http
GET /api/v1/participants/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "participant_123",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "ndisNumber": "123456789",
    "email": "john.doe@example.com",
    "phone": "+61412345678",
    "status": "active",
    "assignedClinician": {
      "id": "user_456",
      "name": "Dr. Smith"
    },
    "address": {
      "street": "123 Main St",
      "city": "Sydney",
      "state": "NSW",
      "postcode": "2000"
    },
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-25T15:30:00Z"
  }
}
```

#### Create Participant

```http
POST /api/v1/participants
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "ndisNumber": "123456789",
  "email": "john.doe@example.com",
  "phone": "+61412345678",
  "assignedClinicianId": "user_456"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "participant_123",
    "firstName": "John",
    "lastName": "Doe",
    // ... full participant object
  }
}
```

#### Update Participant

```http
PATCH /api/v1/participants/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+61498765432",
  "status": "inactive"
}
```

**Response:** `200 OK`

#### Delete Participant

```http
DELETE /api/v1/participants/{id}
```

**Response:** `204 No Content`

---

### Reports

#### List Reports

```http
GET /api/v1/reports
```

**Query Parameters:**
- `participantId` (string): Filter by participant
- `type` (string): Report type (`session_note`, `assessment`, `progress_report`)
- `status` (string): Filter by status (`draft`, `review`, `approved`)
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "report_123",
      "type": "session_note",
      "title": "Session Note - Jan 25, 2026",
      "participantId": "participant_123",
      "status": "approved",
      "aiConfidence": 94,
      "generatedBy": "ai",
      "createdAt": "2026-01-25T10:00:00Z",
      "approvedAt": "2026-01-25T14:30:00Z"
    }
  ]
}
```

#### Generate Report

```http
POST /api/v1/reports/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "participantId": "participant_123",
  "type": "session_note",
  "sessionData": {
    "date": "2026-01-25",
    "duration": 60,
    "activities": ["Assessment", "Goal setting"],
    "notes": "Client showed significant progress..."
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "report_123",
    "status": "draft",
    "aiConfidence": 87,
    "content": {
      // Generated report content
    }
  }
}
```

#### Approve Report

```http
POST /api/v1/reports/{id}/approve
```

**Response:** `200 OK`

---

### Users

#### Get Current User

```http
GET /api/v1/users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "clinician",
    "organizationId": "org_456",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

#### Update Profile

```http
PATCH /api/v1/users/me
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "preferences": {
    "theme": "light"
  }
}
```

---

### Analytics

#### Dashboard Metrics

```http
GET /api/v1/analytics/dashboard
```

**Query Parameters:**
- `startDate` (string): ISO date
- `endDate` (string): ISO date

**Response:**
```json
{
  "success": true,
  "data": {
    "activeParticipants": 127,
    "billableHours": 34.5,
    "reportsGenerated": 892,
    "pendingApprovals": 5,
    "trends": {
      "participantsChange": 12,
      "hoursChange": -2.1
    }
  }
}
```

---

## Webhooks

### Overview

Webhooks allow real-time notifications when events occur in Praxis AI.

### Supported Events

- `participant.created`
- `participant.updated`
- `participant.deleted`
- `report.generated`
- `report.approved`
- `report.rejected`
- `user.created`
- `session.completed`

### Webhook Payload

```json
{
  "event": "report.approved",
  "timestamp": "2026-01-25T15:30:00Z",
  "data": {
    "reportId": "report_123",
    "participantId": "participant_456",
    "approvedBy": "user_789"
  },
  "webhookId": "webhook_abc"
}
```

### Webhook Security

Verify webhook authenticity using HMAC signature:

```typescript
import crypto from 'crypto';

function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}
```

---

## SDKs & Client Libraries

### Official SDKs

#### TypeScript/JavaScript
```bash
npm install @praxis-ai/sdk
```

```typescript
import { SpectraClinical } from '@praxis-ai/sdk';

const client = new SpectraClinical({
  apiKey: 'your-api-key',
  environment: 'production',
});

const participants = await client.participants.list({
  status: 'active',
  limit: 20,
});
```

#### Python
```bash
pip install praxis-ai
```

```python
from spectra_clinical import SpectraClinical

client = SpectraClinical(api_key='your-api-key')
participants = client.participants.list(status='active', limit=20)
```

### Community Libraries

- Ruby: `praxis-ai-ruby` (community-maintained)
- PHP: `praxis-ai-php` (community-maintained)

---

## Support

### API Questions
- **Email**: api@jddigitalsystems.com
- **Documentation**: https://docs.praxis-ai.com
- **Status Page**: https://status.praxis-ai.com

### Reporting Issues
- Security issues: security@jddigitalsystems.com
- Bug reports: Create issue on GitHub
- Feature requests: feature-requests@jddigitalsystems.com

---

**API Version**: 1.0.0
**Last Updated**: January 2026
**Maintained by**: JD Digital Systems API Team
