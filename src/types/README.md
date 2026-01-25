# Praxis AI Type Definitions

**Production-Ready TypeScript Type System**

> 🚨 **ZERO TOLERANCE for `any` types** - This project enforces strict type safety for production deployment.

---

## Overview

This directory contains all TypeScript type definitions for the Praxis AI Platform. The type system is designed to ensure 100% type safety across the entire application, preventing runtime errors and improving developer experience.

## File Structure

```
src/types/
├── index.ts              # Central export file - import from here
├── README.md            # This file
├── enums.ts             # All enumeration types
├── common.ts            # Shared utility types
├── participant.ts       # Participant-related types
├── report.ts            # Report and documentation types
├── user.ts              # User and authentication types
├── ndis.ts              # NDIS-specific types
├── audit.ts             # Audit trail and compliance types
└── ai.ts                # AI generation and automation types
```

## Usage

### Importing Types

**✅ CORRECT - Import from the index file:**

```typescript
import {
  Participant,
  ParticipantStatus,
  Report,
  ReportType,
  User,
  UserRole
} from '@/types';
```

**❌ WRONG - Don't import from individual files:**

```typescript
// Don't do this
import { Participant } from '@/types/participant';
```

### Using Enums

```typescript
import { ParticipantStatus, ReportStatus } from '@/types';

// ✅ CORRECT
const participant: Participant = {
  status: ParticipantStatus.ACTIVE,
  // ...other fields
};

// ✅ CORRECT - String literal types also work
const status: ParticipantStatus = 'active';

// ❌ WRONG - Using raw strings without type
const status = 'active'; // TypeScript won't catch typos!
```

### Component Props

```typescript
import { Participant, ParticipantSummary } from '@/types';

// ✅ CORRECT - Explicit interface for props
interface ParticipantCardProps {
  participant: Participant;
  onEdit?: (id: string) => void;
  showAvatar?: boolean;
}

export function ParticipantCard({
  participant,
  onEdit,
  showAvatar = true
}: ParticipantCardProps) {
  // Component implementation
}

// ❌ WRONG - Using 'any'
function ParticipantCard(props: any) {
  // This defeats TypeScript's purpose!
}
```

### API Response Types

```typescript
import { APIResponse, Participant, successResponse, errorResponse } from '@/types';

// ✅ CORRECT - Typed API response
async function getParticipant(id: string): Promise<APIResponse<Participant>> {
  try {
    const participant = await db.participant.findUnique({ where: { id } });
    return successResponse(participant);
  } catch (error) {
    return errorResponse('Failed to fetch participant', 'FETCH_ERROR');
  }
}
```

### Pagination

```typescript
import { PaginatedResponse, Participant, paginatedResponse } from '@/types';

// ✅ CORRECT - Typed pagination
async function getParticipants(
  page: number,
  limit: number
): Promise<PaginatedResponse<Participant>> {
  const participants = await db.participant.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await db.participant.count();

  return paginatedResponse(participants, total, page, limit);
}
```

### Type Guards

```typescript
import { isValidEmail, isValidNDISNumber, isParticipantStatus } from '@/types';

// ✅ CORRECT - Runtime type validation
function validateEmail(email: unknown): boolean {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }
  // TypeScript now knows email is a string
  return true;
}

// ✅ CORRECT - Status validation
function setStatus(status: unknown) {
  if (isParticipantStatus(status)) {
    // TypeScript knows status is ParticipantStatus
    participant.status = status;
  }
}
```

### Nullable Types

```typescript
import { Nullable } from '@/types';

// ✅ CORRECT - Explicit nullable types
interface Participant {
  dischargeDate: Nullable<Date>; // Date | null
  lastActivity: Nullable<Date>;
}

// ✅ CORRECT - Handling nullable values
function formatDate(date: Nullable<Date>): string {
  if (date === null) {
    return 'N/A';
  }
  return date.toLocaleDateString();
}
```

### Optional Fields

```typescript
import { Optional } from '@/types';

// ✅ CORRECT - Make specific fields optional
type ParticipantCreateInput = Optional<Participant, 'id' | 'createdAt' | 'updatedAt'>;

// ✅ CORRECT - Partial update
type ParticipantUpdateInput = Partial<ParticipantCreateInput>;
```

## Type Categories

### 1. Enums (enums.ts)

Fixed sets of values for type safety:

- `ParticipantStatus` - active, inactive, pending_review, etc.
- `ReportStatus` - draft, review, final, approved, etc.
- `ReportType` - functional_capacity, progress_report, etc.
- `UserRole` - admin, senior_ot, ot, etc.
- `NDISPlanStatus` - active, expiring, expired, depleted
- `AuditAction` - create, edit, delete, view, etc.
- `AIModelType` - gemini_pro, gpt_4, clinical_llm, etc.

### 2. Common Types (common.ts)

Reusable utility types:

- `BaseEntity` - id, createdAt, updatedAt
- `APIResponse<T>` - Wrapper for API responses
- `PaginatedResponse<T>` - Paginated data
- `FilterParams` - Generic filter parameters
- `ValidationError` - Form validation errors
- `MetricCard` - Dashboard metric cards
- `Nullable<T>` - T | null
- `Optional<T, K>` - Make specific fields optional

### 3. Participant Types (participant.ts)

- `Participant` - Main participant entity
- `Goal` - Participant goals with progress tracking
- `Session` - Session records with billing
- `Guardian` - Guardian/legal representative info
- `Medication` - Medication tracking
- `ParticipantSummary` - Lightweight summary for lists
- `ParticipantStats` - Statistics and metrics

### 4. Report Types (report.ts)

- `Report` - Main report entity
- `ReportContent` - Structured report content
- `ReportSection` - Individual report sections
- `Recommendation` - Clinical recommendations
- `NDISEvidence` - NDIS evidence mapping
- `SignatureBlock` - Digital signatures
- `ReportTemplate` - Report templates
- `ReportSummary` - Lightweight summary

### 5. User Types (user.ts)

- `User` - User entity with full profile
- `Session` - Authentication session
- `LoginCredentials` - Login data
- `LoginResponse` - Authentication response
- `UserPreferences` - User settings
- `NotificationSettings` - Notification config
- `Permission` - Role-based permissions
- `Organization` - Organization entity
- `Team` - Team structure

### 6. NDIS Types (ndis.ts)

- `NDISPlan` - NDIS plan entity
- `FundingCategory` - Core, Capacity, Capital
- `FundingBudget` - Detailed budget breakdown
- `ServiceAgreement` - Provider agreements
- `NDISClaim` - Billing claims
- `NDISSupportItem` - NDIS price guide items
- `PlanAlert` - Plan alerts and warnings

### 7. Audit Types (audit.ts)

- `AuditLog` - Complete audit trail
- `ConsentRecord` - Consent management
- `ComplianceCheck` - Compliance monitoring
- `SecurityEvent` - Security incidents
- `DataAccessLog` - Data access tracking
- `PrivacyImpactAssessment` - Privacy assessments

### 8. AI Types (ai.ts)

- `AIGenerationRequest` - AI generation requests
- `AIGenerationResult` - AI output
- `AIModelConfig` - AI model configuration
- `AIChatMessage` - Chat interface messages
- `AITemplate` - AI prompt templates
- `AISuggestion` - AI-generated suggestions
- `AIQualityCheck` - Quality validation

## Best Practices

### 1. Always Use Explicit Types

```typescript
// ✅ CORRECT
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return age;
}

// ❌ WRONG
function calculateAge(birthDate) {
  return new Date().getFullYear() - birthDate.getFullYear();
}
```

### 2. Use Type Inference Where Appropriate

```typescript
// ✅ CORRECT - TypeScript infers the return type from Participant[]
const participants = await getParticipants();

// ⚠️ REDUNDANT - Return type is already explicit in function signature
const participants: Participant[] = await getParticipants();
```

### 3. Create Interfaces for Component Props

```typescript
// ✅ CORRECT
interface DashboardProps {
  userId: string;
  showMetrics?: boolean;
  onRefresh?: () => void;
}

export function Dashboard({ userId, showMetrics = true, onRefresh }: DashboardProps) {
  // ...
}

// ❌ WRONG - Inline types are harder to maintain
export function Dashboard({ userId, showMetrics, onRefresh }: {
  userId: string;
  showMetrics?: boolean;
  onRefresh?: () => void;
}) {
  // ...
}
```

### 4. Use Enums for Fixed Values

```typescript
// ✅ CORRECT
import { ParticipantStatus } from '@/types';

const status: ParticipantStatus = ParticipantStatus.ACTIVE;

// ❌ WRONG - Magic strings
const status = 'active';
```

### 5. Validate Runtime Data

```typescript
// ✅ CORRECT - Use type guards
import { isValidEmail } from '@/types';

function processEmail(email: unknown) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }
  // Now TypeScript knows email is string
  sendEmail(email);
}

// ❌ WRONG - Assuming type
function processEmail(email: any) {
  sendEmail(email); // No validation!
}
```

### 6. Use Generic Types for Reusability

```typescript
// ✅ CORRECT
interface DataTable<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

// Usage
const participantTable: DataTable<Participant> = { ... };
const reportTable: DataTable<Report> = { ... };
```

### 7. Document Complex Types

```typescript
/**
 * Represents a participant's NDIS plan with funding breakdown
 *
 * @property totalFunding - Total plan budget in AUD
 * @property utilizationPercentage - Percentage of budget used (0-100)
 * @property fundingCategories - Breakdown by Core, Capacity, Capital
 */
export interface NDISPlan extends BaseEntity {
  totalFunding: number;
  utilizationPercentage: number;
  fundingCategories: FundingCategory[];
}
```

## Common Patterns

### Creating New Records

```typescript
import { ParticipantCreateInput, ParticipantStatus } from '@/types';

const newParticipant: ParticipantCreateInput = {
  firstName: 'John',
  lastName: 'Doe',
  ndisNumber: '123456789',
  status: ParticipantStatus.ACTIVE,
  // ... other required fields
};
```

### Updating Records

```typescript
import { ParticipantUpdateInput } from '@/types';

const updates: ParticipantUpdateInput = {
  phone: '0400 000 000',
  address: {
    street: '123 Main St',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'Australia',
  },
};
```

### Filtering and Searching

```typescript
import { ParticipantFilterParams, ParticipantStatus } from '@/types';

const filters: ParticipantFilterParams = {
  status: [ParticipantStatus.ACTIVE, ParticipantStatus.PENDING_REVIEW],
  search: 'John',
  hasUpcomingReview: true,
};
```

## Testing with Types

```typescript
import { Participant, ParticipantStatus } from '@/types';

// Mock data for testing
const mockParticipant: Participant = {
  id: '123',
  firstName: 'Test',
  lastName: 'User',
  ndisNumber: '123456789',
  status: ParticipantStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  // ... other required fields
};

describe('ParticipantCard', () => {
  it('renders participant name', () => {
    render(<ParticipantCard participant={mockParticipant} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

## Migration Guide

### Removing `any` Types

**Before:**
```typescript
function processData(data: any) {
  return data.map((item: any) => item.name);
}
```

**After:**
```typescript
import { Participant } from '@/types';

function processData(data: Participant[]): string[] {
  return data.map((item) => item.firstName);
}
```

### Adding Type Safety to Existing Code

1. Import required types from `@/types`
2. Add explicit type annotations
3. Replace `any` with proper types
4. Add type guards for runtime validation
5. Use enums instead of string literals
6. Test thoroughly

## Troubleshooting

### TypeScript Error: Type 'X' is not assignable to type 'Y'

**Solution:** Check that you're using the correct enum values or type definitions.

```typescript
// ❌ WRONG
participant.status = 'active'; // String literal

// ✅ CORRECT
participant.status = ParticipantStatus.ACTIVE;
```

### Property 'X' does not exist on type 'Y'

**Solution:** Check the interface definition and ensure all required properties are provided.

```typescript
// Check what properties are required
import { Participant } from '@/types';
// Ctrl+Click on Participant to see definition
```

### Cannot find module '@/types'

**Solution:** Check your `tsconfig.json` path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Contributing

When adding new types:

1. ✅ Choose the appropriate file (or create a new one for new domains)
2. ✅ Follow existing naming conventions (PascalCase for types, UPPER_SNAKE_CASE for enums)
3. ✅ Add JSDoc comments for complex types
4. ✅ Export from `index.ts`
5. ✅ Create type guards if needed
6. ✅ Update this README with usage examples
7. ✅ Run `npm run type-check` to verify

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Praxis AI CLAUDE.md](../../docs/CLAUDE.md) - AI development guidelines

---

**Last Updated:** January 2026
**Maintained by:** JD Digital Systems Development Team
