# Claude AI Development Guidelines

> Guidelines for AI-assisted development on the Praxis AI project

---

## Overview

This document provides guidelines for using Claude AI and other AI assistants when working on the Praxis AI codebase. Following these guidelines ensures consistent, high-quality code and maintains the project's architectural integrity as it scales to support thousands of users.

---

## Project Context for AI Assistants

### System Summary
Praxis AI (Praxis AI Platform) is a clinical workflow management system for healthcare professionals managing NDIS participants. The system emphasizes:

- **Compliance**: NDIS regulations, Australian privacy laws, healthcare data security
- **Scalability**: Designed to support 1,000+ concurrent users
- **Reliability**: Healthcare-critical application requiring 99.9% uptime
- **AI Integration**: ML-powered report generation with human-in-the-loop review
- **Accessibility**: WCAG 2.1 AA compliance minimum

### Technology Stack
- **Frontend**: Next.js 16+ (App Router), React 19+, TypeScript 5
- **Styling**: Tailwind CSS 4 with custom design system
- **State Management**: React Context + Server Components
- **Data Fetching**: React Server Components, Server Actions
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel (staging), AWS (production)

---

## Development Guidelines

### 1. Code Quality Standards

#### TypeScript Usage
```typescript
// ✅ GOOD: Explicit types, clear interfaces
interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  ndisNumber: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

// ❌ BAD: Using 'any', implicit types
const getParticipant = (id: any) => {
  // ...
}
```

#### Component Patterns
```typescript
// ✅ GOOD: Server Component with clear data flow
async function ParticipantsList() {
  const participants = await getParticipants();

  return (
    <div>
      {participants.map(p => (
        <ParticipantCard key={p.id} participant={p} />
      ))}
    </div>
  );
}

// ✅ GOOD: Client Component with 'use client' directive
'use client';

import { useState } from 'react';

export function ParticipantFilter() {
  const [filter, setFilter] = useState('');
  // ...
}
```

### 2. File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Route group for dashboard layout
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components (buttons, inputs)
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and helpers
│   ├── db/               # Database client and queries
│   ├── api/              # API client functions
│   ├── utils/            # General utilities
│   └── validators/       # Input validation schemas
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── constants/            # Application constants
```

### 3. Naming Conventions

- **Components**: PascalCase (`ParticipantCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase with descriptive names (`ParticipantStatus`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PARTICIPANTS_PER_PAGE`)
- **API Routes**: kebab-case (`/api/participants/[id]/reports`)

### 4. Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
async function createReport(participantId: string, data: ReportData) {
  try {
    const report = await db.report.create({
      data: {
        participantId,
        ...data,
      },
    });

    return { success: true, data: report };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: 'Invalid report data' };
    }

    // Log error for monitoring
    logger.error('Failed to create report', { error, participantId });

    return { success: false, error: 'Failed to create report' };
  }
}
```

### 5. Security Considerations

```typescript
// ✅ GOOD: Input validation
import { z } from 'zod';

const participantSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  ndisNumber: z.string().regex(/^\d{9}$/),
  dateOfBirth: z.date(),
});

// ✅ GOOD: Authorization checks
async function getParticipant(id: string, userId: string) {
  const participant = await db.participant.findUnique({
    where: { id }
  });

  if (!participant) {
    throw new NotFoundError('Participant not found');
  }

  // Ensure user has access to this participant
  if (!await hasAccess(userId, participant.id)) {
    throw new UnauthorizedError('Access denied');
  }

  return participant;
}
```

---

## AI-Assisted Development Workflows

### When to Use AI Assistance

#### ✅ Recommended Use Cases
- **Boilerplate Generation**: Creating new components, API routes, database models
- **Code Refactoring**: Improving existing code while maintaining functionality
- **Test Writing**: Generating test cases and fixtures
- **Documentation**: Writing JSDoc comments, updating README files
- **Bug Analysis**: Understanding error messages and suggesting fixes
- **Type Definitions**: Creating TypeScript interfaces and types
- **Accessibility**: Reviewing and improving WCAG compliance

#### ⚠️ Use with Caution
- **Security-Critical Code**: Authentication, authorization, data encryption
- **Database Migrations**: Schema changes (always review carefully)
- **Third-Party Integrations**: API integrations with external services
- **Performance Optimization**: Requires profiling and measurement

#### ❌ Avoid AI for
- **Production Deployments**: Always use manual review and approval
- **Security Decisions**: Security architecture should be human-designed
- **Compliance Decisions**: NDIS and privacy compliance requires expert review

### Prompting Best Practices

#### Good Prompts
```
"Create a Server Component for displaying participant details.
It should fetch data from the database, handle loading states,
and display error boundaries. Follow our TypeScript conventions
and use the existing ParticipantCard component."
```

```
"Refactor this component to use Server Actions for form submission
instead of API routes. Ensure proper error handling and validation
using Zod."
```

#### Poor Prompts
```
"Make it better" // Too vague
"Add all the features" // Unclear requirements
"Fix the bug" // No context provided
```

### Code Review Checklist for AI-Generated Code

Before committing AI-generated code, verify:

- [ ] **Type Safety**: No `any` types, all props typed correctly
- [ ] **Error Handling**: Proper try-catch blocks and error boundaries
- [ ] **Security**: No SQL injection, XSS vulnerabilities, or exposed secrets
- [ ] **Performance**: No N+1 queries, unnecessary re-renders, or memory leaks
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation, focus management
- [ ] **Testing**: Unit tests included and passing
- [ ] **Documentation**: JSDoc comments for public APIs
- [ ] **Consistency**: Follows existing code patterns and conventions
- [ ] **Dependencies**: No unnecessary package additions

---

## Context Preservation

### Critical Files to Reference

When working on specific features, provide AI assistants with context from these files:

#### Design System
- `src/app/globals.css` - Tailwind configuration and custom CSS
- `tailwind.config.ts` - Theme configuration
- `.designs/*.html` - UI design mockups

#### Type Definitions
- `src/types/participant.ts` - Participant data models
- `src/types/report.ts` - Report data models
- `src/types/user.ts` - User and permission models

#### Core Utilities
- `src/lib/utils.ts` - Common utilities
- `src/lib/validators/` - Input validation schemas
- `src/lib/db/` - Database client configuration

### Sharing Context with AI

When requesting assistance, include:

1. **File Content**: Share relevant file contents
2. **Error Messages**: Full error stack traces
3. **Expected Behavior**: Clear description of desired outcome
4. **Constraints**: Performance, security, or compliance requirements
5. **Related Code**: Dependencies or connected components

---

## Testing with AI Assistance

### Test Generation Guidelines

```typescript
// ✅ GOOD: Comprehensive test coverage
describe('ParticipantCard', () => {
  it('renders participant information correctly', () => {
    // Arrange
    const participant = mockParticipant();

    // Act
    render(<ParticipantCard participant={participant} />);

    // Assert
    expect(screen.getByText(participant.firstName)).toBeInTheDocument();
    expect(screen.getByText(participant.ndisNumber)).toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    const participant = { ...mockParticipant(), firstName: undefined };
    render(<ParticipantCard participant={participant} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('applies correct accessibility attributes', () => {
    render(<ParticipantCard participant={mockParticipant()} />);
    expect(screen.getByRole('article')).toHaveAttribute('aria-label');
  });
});
```

### Test Coverage Requirements

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All critical user flows
- **E2E Tests**: Complete workflows (registration, report generation)
- **Accessibility Tests**: All interactive components

---

## Performance Optimization

### Guidelines for Scalability

```typescript
// ✅ GOOD: Optimized database queries
async function getParticipantsWithReports(userId: string) {
  return await db.participant.findMany({
    where: { userId },
    include: {
      reports: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
    take: 50, // Pagination
  });
}

// ✅ GOOD: Memoization for expensive computations
const processedData = useMemo(() => {
  return participants.map(p => ({
    ...p,
    fullName: `${p.firstName} ${p.lastName}`,
    age: calculateAge(p.dateOfBirth),
  }));
}, [participants]);

// ✅ GOOD: Lazy loading for large components
const ReportGenerator = dynamic(() => import('./ReportGenerator'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

---

## Common Pitfalls to Avoid

### 1. Over-reliance on AI
- Always review and understand AI-generated code
- Test thoroughly before committing
- Validate security and compliance implications

### 2. Ignoring Project Patterns
- Follow existing architectural decisions
- Don't introduce new patterns without team discussion
- Maintain consistency across the codebase

### 3. Neglecting Edge Cases
- AI might not consider all error scenarios
- Test with invalid inputs and edge cases
- Handle loading and error states

### 4. Performance Blindspots
- AI-generated code might not be optimized
- Profile and measure performance impact
- Consider scalability implications

---

## Resources

### Internal Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](./SECURITY.md) - Security policies

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Feedback and Improvements

This document is a living guide. If you discover better practices or patterns while working with AI assistants, please contribute updates through pull requests.

**Maintained by**: JD Digital Systems Development Team
**Last Updated**: January 2026
