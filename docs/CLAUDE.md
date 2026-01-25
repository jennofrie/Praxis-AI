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
- **Frontend**: Next.js 16.1.4 (App Router), React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS 4 with custom design system
- **Backend**: Supabase (PostgreSQL, Edge Functions, Authentication, Storage)
- **AI Integration**: Google Gemini 2.5 Pro / 2.0 Flash (tiered model usage)
- **State Management**: React Context + Server Components
- **Data Fetching**: Supabase client, Server Actions
- **PDF Processing**: pdf-parse, jsPDF for generation
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel (frontend), Supabase (backend services)

---

## Development Guidelines

### 1. Code Quality Standards

#### TypeScript Usage

**🚨 CRITICAL PRODUCTION RULE: ZERO TOLERANCE FOR `any` TYPES**

This project MUST be production-ready with 100% type safety. Using `any` types is **STRICTLY PROHIBITED** and will block production deployment.

**Rules:**
- ❌ **NEVER** use `any` type - it defeats TypeScript's purpose
- ❌ **NEVER** use implicit `any` (enable `noImplicitAny` in tsconfig.json)
- ✅ **ALWAYS** define explicit interfaces/types for all data structures
- ✅ **ALWAYS** type all function parameters and return values
- ✅ **ALWAYS** type all React component props
- ✅ Use `unknown` for truly unknown types, then narrow with type guards
- ✅ Use generic types `<T>` when appropriate for reusable components

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

// ✅ GOOD: Typed function with explicit return type
function getParticipant(id: string): Promise<Participant | null> {
  // ...
}

// ✅ GOOD: Typed component props
interface ParticipantCardProps {
  participant: Participant;
  onEdit?: (id: string) => void;
}

export function ParticipantCard({ participant, onEdit }: ParticipantCardProps) {
  // ...
}

// ❌ BAD: Using 'any' - NEVER DO THIS
const getParticipant = (id: any) => {
  // ...
}

// ❌ BAD: Implicit any in parameters
function processData(data) { // TypeScript error if noImplicitAny is enabled
  // ...
}

// ❌ BAD: any in props
function Card({ data }: { data: any }) {
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
├── app/                          # Next.js App Router pages
│   ├── (authenticated)/         # Protected routes (dashboard, reports, toolkit)
│   ├── api/ai/                  # AI feature API routes
│   ├── globals.css              # Global styles and animations
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── layout/                  # Layout components (Header, Sidebar)
│   ├── toolkit/                 # Clinical toolkit components
│   ├── landing/                 # Landing page components
│   └── ndis-plans/              # NDIS plan components
├── lib/                         # Utilities and helpers
│   ├── supabase/                # Supabase client configuration
│   ├── pdf-export.ts            # PDF generation utilities
│   ├── pdf-parser.ts            # PDF text extraction
│   └── utils.ts                 # General utilities
├── types/                       # TypeScript type definitions
│   └── senior-planner.ts        # Section 34 & CoC types
├── hooks/                       # Custom React hooks
└── middleware.ts                # Auth middleware
supabase/
├── functions/                    # Edge Functions
│   ├── senior-planner-audit/    # Section 34 Auditor
│   ├── coc-eligibility-assessor/# CoC Assessor
│   ├── _shared/                 # Shared utilities (CORS, Gemini client)
│   └── [other-functions]/       # Additional AI features
└── migrations/                   # Database migrations
```

### 3. Naming Conventions

- **Components**: PascalCase (`ParticipantCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase with descriptive names (`ParticipantStatus`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PARTICIPANTS_PER_PAGE`)
- **API Routes**: kebab-case (`/api/participants/[id]/reports`)

### 4. Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling with Supabase
async function createReport(participantId: string, data: ReportData) {
  try {
    const supabase = createClient();

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        participant_id: participantId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create report', { error, participantId });
      return { success: false, error: 'Failed to create report' };
    }

    return { success: true, data: report };
  } catch (error) {
    console.error('Unexpected error creating report', { error, participantId });
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

### 5. Security Considerations

```typescript
// ✅ GOOD: Row Level Security (RLS) with Supabase
// Database policies should enforce access control
// Example: profiles table policy
CREATE POLICY "Users can only view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

// ✅ GOOD: Input validation for Edge Functions
interface AuditRequest {
  documentType: string;
  documentContent: string;
  documentName?: string;
  userId?: string;
}

const MIN_CONTENT_LENGTH = 100;

// Validate request
if (!body.documentContent || body.documentContent.trim().length < MIN_CONTENT_LENGTH) {
  return new Response(
    JSON.stringify({ error: 'Insufficient content' }),
    { status: 400, headers: corsHeaders }
  );
}

// ✅ GOOD: Secure API routes with authentication
export async function POST(request: Request) {
  const supabase = createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Process authenticated request
  // ...
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

## 🚨 CRITICAL: Pre-Push Checklist

**MANDATORY VERIFICATION BEFORE EVERY GITHUB PUSH**

This checklist MUST be completed before pushing ANY changes to GitHub. Failing to complete these checks can break production deployments and block other developers.

### 1. Build Verification
```bash
# Run production build
npm run build

# Verify exit code is 0 (success)
echo $?  # Should output: 0
```

**Requirements:**
- ✅ Build completes successfully with exit code 0
- ✅ No build errors or warnings in output
- ✅ All route segments compile correctly
- ✅ Static page generation succeeds
- ❌ NEVER push if build fails

### 2. TypeScript Validation
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Verify exit code is 0 (success)
echo $?  # Should output: 0
```

**Common Issues to Check:**
- [ ] No `any` types used (ZERO TOLERANCE)
- [ ] No implicit `any` parameters
- [ ] All function return types declared
- [ ] All component props properly typed
- [ ] No type assertions (`as`) without justification
- [ ] Interface/type definitions exported correctly
- [ ] No missing import statements
- [ ] No unused variables or imports

### 3. Lint Verification
```bash
# Run ESLint
npm run lint

# Check for errors (warnings are acceptable with justification)
```

**Fix all lint errors:**
- [ ] No ESLint errors
- [ ] Warnings reviewed and justified
- [ ] Auto-fixable issues resolved with `npm run lint -- --fix`
- [ ] Unused imports removed
- [ ] Console.log statements removed (except in Edge Functions for debugging)

### 4. Dependency Verification
```bash
# Check for dependency conflicts
npm ls

# Check for security vulnerabilities
npm audit

# Verify package-lock.json is committed
git status package-lock.json
```

**Requirements:**
- [ ] No dependency conflicts (no `UNMET DEPENDENCY` messages)
- [ ] Critical/High vulnerabilities addressed
- [ ] `package.json` and `package-lock.json` in sync
- [ ] No duplicate dependencies
- [ ] All peer dependencies satisfied
- [ ] Only necessary packages installed

### 5. Database Schema Verification (Supabase)

**For migrations:**
```bash
# Review migration files
ls -la supabase/migrations/

# Check migration naming convention
# Format: NNN_descriptive_name.sql
```

**Checklist:**
- [ ] Migration files numbered sequentially
- [ ] No missing columns in table definitions
- [ ] RLS policies defined for new tables
- [ ] Foreign key constraints properly set
- [ ] Default values specified where needed
- [ ] Indexes created for frequently queried columns
- [ ] Migration tested locally before push

### 6. Edge Function Validation

**For Supabase Edge Functions:**
```bash
# Check function deployability
cd supabase/functions/[function-name]
deno check index.ts  # If deno is installed locally
```

**Checklist:**
- [ ] All imports use JSR format (`jsr:@supabase/...`)
- [ ] CORS headers properly configured
- [ ] Environment variables accessed via `Deno.env.get()`
- [ ] Error handling implemented
- [ ] Request validation included
- [ ] Response formats consistent
- [ ] No hardcoded secrets or API keys
- [ ] Logging added for debugging

### 7. Code Completeness Check

**CRITICAL: Verify no incomplete code:**

- [ ] No `// TODO:` comments without implementation
- [ ] No `console.log('test')` or debug statements
- [ ] No commented-out code blocks (remove or document why kept)
- [ ] No placeholder functions that return empty/mock data
- [ ] No `throw new Error('Not implemented')`
- [ ] All conditional branches have implementations
- [ ] All switch cases covered
- [ ] No empty catch blocks
- [ ] All async operations properly awaited

**Example of INCOMPLETE code to avoid:**
```typescript
// ❌ BAD: Incomplete implementation
async function processData(data: Data) {
  // TODO: Add validation
  // console.log('Processing:', data);

  try {
    // Implementation pending
  } catch (error) {
    // Handle error
  }
}
```

**Example of COMPLETE code:**
```typescript
// ✅ GOOD: Complete implementation
async function processData(data: Data): Promise<ProcessResult> {
  // Validate input
  if (!data || !data.id) {
    throw new ValidationError('Invalid data: missing required fields');
  }

  try {
    const result = await supabase
      .from('data_table')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseError(result.error.message);
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('[processData] Error:', error);
    return { success: false, error: error.message };
  }
}
```

### 8. Component/Feature Testing

**Manual testing checklist:**
- [ ] New features tested in development mode
- [ ] All user interactions work as expected
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] Success messages appear appropriately
- [ ] Forms validate inputs correctly
- [ ] Navigation flows work
- [ ] Responsive design tested (mobile, tablet, desktop)

### 9. Git Hygiene

```bash
# Review what's being committed
git status
git diff

# Verify commit message is descriptive
# Format: type: brief description
# Example: feat: add CoC assessment history panel
```

**Checklist:**
- [ ] Only relevant files staged
- [ ] No accidental `.env` or secret files
- [ ] No large binary files (except intentional assets)
- [ ] Commit message follows convention
- [ ] No merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] Branch is up to date with main/master

### 10. Final Verification Command

**Run this complete check before push:**
```bash
# Complete pre-push verification
npm run build && \
npx tsc --noEmit && \
npm run lint && \
npm audit --audit-level=high && \
echo "✅ All checks passed! Safe to push."
```

**Expected output:**
```
✓ Compiled in X.Xs
✓ No TypeScript errors
✓ No ESLint errors
✓ No high/critical vulnerabilities
✅ All checks passed! Safe to push.
```

---

## ⚠️ What To Do If Checks Fail

### Build Failures
1. Read the error message carefully
2. Identify the failing file/component
3. Check for syntax errors, missing imports
4. Verify all dependencies are installed
5. Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

### TypeScript Errors
1. Address errors one by one (don't skip with `@ts-ignore`)
2. Add proper type definitions
3. Use type guards for runtime checks
4. Consult existing type patterns in `src/types/`

### Lint Errors
1. Run auto-fix: `npm run lint -- --fix`
2. Review remaining errors
3. Fix manually or add justification comments
4. Never disable rules without team discussion

### Dependency Conflicts
1. Review `package-lock.json` changes
2. Remove conflicting package: `npm uninstall [package]`
3. Reinstall: `npm install`
4. If persistent: delete `node_modules` and `package-lock.json`, then `npm install`

### Incomplete Code
1. Search for TODO comments: `grep -r "TODO" src/`
2. Search for console.log: `grep -r "console.log" src/`
3. Remove or implement before committing

---

## Emergency Bypass (USE SPARINGLY)

**ONLY use if you understand the risks and have a valid reason:**

```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify

# Force push (NEVER to main/master without approval)
git push --force
```

**When emergency bypass is acceptable:**
- Hotfix for production-breaking issue
- Documented technical debt with issue ticket
- Approved by team lead

**When emergency bypass is NOT acceptable:**
- "I'll fix it later" (fix it now)
- "It works on my machine" (it must work in production)
- Skipping tests because they're slow (optimize tests, don't skip)

---

## Context Preservation

### Critical Files to Reference

When working on specific features, provide AI assistants with context from these files:

#### Design System
- `src/app/globals.css` - Tailwind configuration, custom CSS, and animations
- `tailwind.config.ts` - Theme configuration
- `.designs/*.html` - UI design mockups

#### Type Definitions
- `src/types/senior-planner.ts` - Section 34 Auditor and CoC Assessment types
- Database schema in `supabase/migrations/` - Table structures and RLS policies

#### Core Utilities
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/pdf-export.ts` - PDF generation utilities
- `src/lib/pdf-parser.ts` - PDF text extraction utilities
- `src/lib/utils.ts` - Common utilities

#### Edge Functions
- `supabase/functions/_shared/cors.ts` - CORS configuration
- `supabase/functions/_shared/gemini.ts` - Gemini AI client with tiered fallback
- `supabase/functions/senior-planner-audit/` - Section 34 Auditor
- `supabase/functions/coc-eligibility-assessor/` - CoC Assessor

#### Configuration
- `middleware.ts` - Authentication middleware
- `.env.local` - Environment variables (NEVER commit this file)

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
// ✅ GOOD: Optimized Supabase queries with pagination
async function getReportsWithPagination(page: number = 1, limit: number = 50) {
  const supabase = createClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('report_audits')
    .select('*, profiles(first_name, last_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { reports: data, total: count, pages: Math.ceil((count || 0) / limit) };
}

// ✅ GOOD: Efficient data fetching with RLS
async function getUserReports() {
  const supabase = createClient();

  // RLS automatically filters by user
  const { data, error } = await supabase
    .from('report_audits')
    .select('id, document_name, overall_score, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return data || [];
}

// ✅ GOOD: Memoization for expensive computations
const processedData = useMemo(() => {
  return participants.map(p => ({
    ...p,
    fullName: `${p.firstName} ${p.lastName}`,
    initials: `${p.firstName[0]}.${p.lastName[0]}.`,
  }));
}, [participants]);

// ✅ GOOD: Lazy loading for large components
const ReportGenerator = dynamic(() => import('./ReportGenerator'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// ✅ GOOD: Edge Function optimization with caching
async function getCachedResult(cacheKey: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from('ai_cache')
    .select('result')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  return data?.result || null;
}
```

---

## Supabase-Specific Patterns

### Database Queries

```typescript
// ✅ GOOD: Proper error handling
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id);

if (error) {
  console.error('Database error:', error);
  return null;
}

// ✅ GOOD: Type-safe queries
interface AuditRecord {
  id: string;
  document_name: string;
  overall_score: number;
  created_at: string;
}

const { data } = await supabase
  .from('report_audits')
  .select('id, document_name, overall_score, created_at')
  .returns<AuditRecord[]>();

// ❌ BAD: Ignoring errors
const { data } = await supabase.from('table').select();
// What if there was an error?
```

### Row Level Security (RLS)

```sql
-- ✅ GOOD: Proper RLS policy
CREATE POLICY "Users can only access their own reports"
  ON report_audits FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ GOOD: Service role bypass for triggers
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);
```

### Edge Functions Best Practices

```typescript
// ✅ GOOD: Proper Edge Function structure
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const body = await req.json();

    // Validate input
    if (!body.required_field) {
      return new Response(
        JSON.stringify({ error: 'Missing required field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process request
    const result = await processRequest(body);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Authentication Patterns

```typescript
// ✅ GOOD: Client-side auth check
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ProtectedComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, []);

  if (!user) return <div>Please sign in</div>;

  return <div>Protected content</div>;
}

// ✅ GOOD: Server-side auth (middleware)
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
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
