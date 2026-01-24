# Testing Guide

> Comprehensive testing documentation for Praxis AI

**Developed by**: JD Digital Systems
**Last Updated**: January 2026

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Strategy](#testing-strategy)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [API Testing](#api-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Test Coverage](#test-coverage)
11. [CI/CD Integration](#cicd-integration)
12. [Best Practices](#best-practices)

---

## Testing Philosophy

### Core Principles

1. **Test Early, Test Often**: Write tests as you develop
2. **Test the Right Things**: Focus on business logic and user flows
3. **Maintainable Tests**: Tests should be easy to read and update
4. **Fast Feedback**: Tests should run quickly
5. **Confidence**: Tests should give confidence to deploy

### Testing Pyramid

```
        /\
       /  \
      / E2E \      <- Few, critical user flows
     /-------\
    /  API   \     <- Moderate, integration tests
   /----------\
  /   Unit     \   <- Many, fast unit tests
 /--------------\
```

**Distribution Target:**
- Unit Tests: 70%
- Integration Tests: 20%
- E2E Tests: 10%

---

## Testing Strategy

### Test Types

| Type | Scope | Speed | Coverage Target |
|------|-------|-------|-----------------|
| Unit | Function/Component | Fast (ms) | 80% |
| Integration | Multiple modules | Medium (seconds) | Critical paths |
| E2E | Full application | Slow (minutes) | Key user flows |
| API | API endpoints | Fast (ms) | All endpoints |
| Performance | Load/Stress | Slow (minutes) | Critical operations |

### When to Write Each Type

#### Unit Tests
- Pure functions
- Business logic
- Utilities
- React components (isolated)

#### Integration Tests
- Database operations
- API endpoints
- Third-party integrations
- Multi-component interactions

#### E2E Tests
- Critical user journeys
- Authentication flows
- Report generation workflow
- Participant management

---

## Unit Testing

### Setup

We use **Jest** and **React Testing Library**:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Running Unit Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific file
npm test ParticipantCard.test.tsx

# Run with coverage
npm test -- --coverage
```

### Component Testing

#### Testing a Presentational Component

```typescript
// components/ParticipantCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ParticipantCard } from './ParticipantCard';

describe('ParticipantCard', () => {
  const mockParticipant = {
    id: 'participant_123',
    firstName: 'John',
    lastName: 'Doe',
    ndisNumber: '123456789',
    status: 'active' as const,
  };

  it('renders participant information correctly', () => {
    render(<ParticipantCard participant={mockParticipant} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();

    render(
      <ParticipantCard
        participant={mockParticipant}
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    await userEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith('participant_123');
  });

  it('displays placeholder for missing data', () => {
    const incompleteParticipant = {
      ...mockParticipant,
      firstName: '',
      lastName: '',
    };

    render(<ParticipantCard participant={incompleteParticipant} />);

    expect(screen.getByText('Unknown Participant')).toBeInTheDocument();
  });
});
```

#### Testing with User Interactions

```typescript
// components/ParticipantFilter.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantFilter } from './ParticipantFilter';

describe('ParticipantFilter', () => {
  it('filters participants on input change', async () => {
    const handleFilter = jest.fn();

    render(<ParticipantFilter onFilter={handleFilter} />);

    const input = screen.getByPlaceholderText('Search participants...');

    await userEvent.type(input, 'John');

    // Debounced, so wait for it
    await waitFor(() => {
      expect(handleFilter).toHaveBeenCalledWith('John');
    });
  });

  it('clears filter on clear button click', async () => {
    const handleFilter = jest.fn();

    render(<ParticipantFilter onFilter={handleFilter} />);

    const input = screen.getByPlaceholderText('Search participants...');
    await userEvent.type(input, 'John');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    expect(input).toHaveValue('');
    expect(handleFilter).toHaveBeenCalledWith('');
  });
});
```

### Testing Utilities

```typescript
// lib/formatDate.test.ts
import { formatDate, formatRelativeTime } from './formatDate';

describe('formatDate', () => {
  it('formats ISO date to readable format', () => {
    const date = '2026-01-25T10:30:00Z';
    expect(formatDate(date)).toBe('January 25, 2026');
  });

  it('handles invalid dates gracefully', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns relative time for past dates', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('1 day ago');
  });
});
```

### Mocking

#### Mocking Modules

```typescript
// Mocking the database client
jest.mock('@/lib/db', () => ({
  db: {
    participant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('getParticipant', () => {
  it('fetches participant from database', async () => {
    const mockParticipant = { id: '123', firstName: 'John' };

    (db.participant.findUnique as jest.Mock).mockResolvedValue(
      mockParticipant
    );

    const result = await getParticipant('123');

    expect(result).toEqual(mockParticipant);
    expect(db.participant.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
    });
  });
});
```

#### Mocking API Calls

```typescript
// Mocking fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: mockData }),
  })
) as jest.Mock;

describe('API calls', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches participants from API', async () => {
    const result = await fetchParticipants();

    expect(fetch).toHaveBeenCalledWith('/api/participants');
    expect(result).toEqual(mockData);
  });
});
```

---

## Integration Testing

### Database Integration Tests

```typescript
// tests/integration/participants.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.participant.deleteMany();
  await prisma.$disconnect();
});

describe('Participant Database Operations', () => {
  it('creates a new participant', async () => {
    const participant = await prisma.participant.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        ndisNumber: '123456789',
        organizationId: 'org_123',
      },
    });

    expect(participant.id).toBeDefined();
    expect(participant.firstName).toBe('John');
  });

  it('finds participant by ID', async () => {
    const created = await prisma.participant.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        ndisNumber: '987654321',
        organizationId: 'org_123',
      },
    });

    const found = await prisma.participant.findUnique({
      where: { id: created.id },
    });

    expect(found).toEqual(created);
  });
});
```

### API Route Testing

```typescript
// app/api/participants/route.test.ts
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('Participants API', () => {
  describe('GET /api/participants', () => {
    it('returns list of participants', async () => {
      const request = new NextRequest('http://localhost:3000/api/participants');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('requires authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/participants', {
        headers: {},
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/participants', () => {
    it('creates a new participant', async () => {
      const body = {
        firstName: 'John',
        lastName: 'Doe',
        ndisNumber: '123456789',
      };

      const request = new NextRequest('http://localhost:3000/api/participants', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBeDefined();
    });

    it('validates input data', async () => {
      const invalidBody = {
        firstName: '',
        ndisNumber: 'invalid',
      };

      const request = new NextRequest('http://localhost:3000/api/participants', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(422);
    });
  });
});
```

---

## End-to-End Testing

### Setup with Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Writing E2E Tests

```typescript
// tests/e2e/participant-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Participant Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('creates a new participant', async ({ page }) => {
    await page.goto('/participants');
    await page.click('text=New Participant');

    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="ndisNumber"]', '123456789');
    await page.fill('[name="email"]', 'john.doe@example.com');

    await page.click('button:has-text("Create")');

    await expect(page).toHaveURL(/\/participants\/participant_.*/);
    await expect(page.locator('h1')).toContainText('John Doe');
  });

  test('searches for participants', async ({ page }) => {
    await page.goto('/participants');

    await page.fill('[placeholder="Search participants..."]', 'John');

    // Wait for debounce
    await page.waitForTimeout(500);

    const results = page.locator('[data-testid="participant-card"]');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('John');
  });

  test('generates AI report', async ({ page }) => {
    await page.goto('/participants/participant_123');
    await page.click('text=Generate Report');

    await page.selectOption('[name="reportType"]', 'session_note');
    await page.fill('[name="sessionNotes"]', 'Client made progress today...');

    await page.click('button:has-text("Generate")');

    // Wait for AI generation
    await expect(page.locator('.loading-indicator')).toBeVisible();
    await expect(page.locator('.loading-indicator')).not.toBeVisible({
      timeout: 30000,
    });

    await expect(page.locator('.report-content')).toBeVisible();
    await expect(page.locator('.ai-confidence')).toContainText('%');
  });
});
```

### Visual Regression Testing

```typescript
// tests/e2e/visual.spec.ts
test('dashboard matches snapshot', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
  });
});
```

---

## API Testing

### Using Supertest

```typescript
// tests/api/participants.api.test.ts
import request from 'supertest';
import app from '@/app';

describe('Participants API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    authToken = response.body.data.accessToken;
  });

  describe('GET /api/v1/participants', () => {
    it('returns 200 with participants list', async () => {
      const response = await request(app)
        .get('/api/v1/participants')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('supports pagination', async () => {
      const response = await request(app)
        .get('/api/v1/participants?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
  });
});
```

---

## Performance Testing

### Load Testing with k6

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const response = http.get('https://app.praxis-ai.com/api/participants');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

Run with:
```bash
k6 run tests/performance/load-test.js
```

---

## Security Testing

### Automated Security Scans

```bash
# Dependency vulnerabilities
npm audit

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.praxis-ai.com

# Snyk scan
snyk test
```

### Manual Security Testing Checklist

- [ ] SQL injection tests
- [ ] XSS vulnerability tests
- [ ] CSRF protection verification
- [ ] Authentication bypass attempts
- [ ] Authorization escalation tests
- [ ] Sensitive data exposure checks
- [ ] Session management tests
- [ ] Input validation tests

---

## Accessibility Testing

### Automated Accessibility Testing

```typescript
// tests/a11y/accessibility.test.ts
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('dashboard has no accessibility violations', async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
```

### Manual Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Proper ARIA labels
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Form labels present
- [ ] Alt text for images

---

## Test Coverage

### Coverage Requirements

- **Overall**: 80% minimum
- **Critical Business Logic**: 100%
- **API Endpoints**: 100%
- **UI Components**: 70%

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html
```

---

## CI/CD Integration

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Best Practices

### Writing Good Tests

#### DO
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent
- ✅ Use meaningful test data

#### DON'T
- ❌ Test implementation details
- ❌ Create interdependent tests
- ❌ Use production data in tests
- ❌ Skip cleanup after tests
- ❌ Write flaky tests

### Test Naming Convention

```typescript
// ✅ GOOD: Descriptive test names
it('creates participant with valid NDIS number', () => {});
it('rejects participant creation with invalid email', () => {});
it('displays error message when API call fails', () => {});

// ❌ BAD: Vague test names
it('works', () => {});
it('test 1', () => {});
it('should do something', () => {});
```

---

## Support

### Testing Questions
- **Email**: qa@jddigitalsystems.com
- **Slack**: #testing channel

---

**Last Updated**: January 2026
**Maintained by**: JD Digital Systems QA Team
