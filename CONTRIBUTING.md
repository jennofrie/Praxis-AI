# Contributing to Praxis AI

> Guidelines for contributing to the Praxis AI project

**Maintained by**: JD Digital Systems

Thank you for your interest in contributing to Praxis AI! This document provides guidelines and best practices for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Review Process](#review-process)

---

## Code of Conduct

### Our Commitment

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- **Be Respectful**: Treat everyone with respect and consideration
- **Be Collaborative**: Work together constructively
- **Be Professional**: Maintain professionalism in all interactions
- **Be Accountable**: Take responsibility for your contributions

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or insults
- Trolling or inflammatory remarks
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

### Reporting

If you witness or experience unacceptable behavior, please report it to conduct@jddigitalsystems.com.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 20.x or higher
- **Git** installed and configured
- **Code Editor** (VS Code recommended)
- **GitHub Account** with 2FA enabled

### Setting Up Development Environment

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/praxis-ai.git
   cd praxis-ai
   ```

2. **Install Dependencies**
   ```bash
   cd praxis-ai
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Open http://localhost:3000
   - Check that the app loads without errors
   - Run tests: `npm test`

### Project Structure

Familiarize yourself with the project structure:
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture
- See [CLAUDE.md](./CLAUDE.md) for AI development guidelines
- See [README.md](./README.md) for project overview

---

## Development Workflow

### Branch Strategy

We use Git Flow with the following branches:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features (e.g., `feature/participant-search`)
- **`bugfix/*`**: Bug fixes (e.g., `bugfix/report-generation`)
- **`hotfix/*`**: Critical production fixes
- **`release/*`**: Release preparation

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add participant search functionality"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Regularly sync with develop
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git rebase develop

# Resolve conflicts if any
git push origin feature/your-feature-name --force-with-lease
```

---

## Coding Standards

### TypeScript Guidelines

#### Always Use Explicit Types
```typescript
// ✅ GOOD
interface User {
  id: string;
  email: string;
  role: 'admin' | 'clinician' | 'viewer';
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ BAD
function getUser(id: any) {
  // ...
}
```

#### Avoid `any` Type
```typescript
// ✅ GOOD
function processData(data: unknown): Result {
  if (isValidData(data)) {
    // Type guard narrows 'unknown' to specific type
    return transformData(data);
  }
  throw new Error('Invalid data');
}

// ❌ BAD
function processData(data: any): any {
  return data.transform();
}
```

#### Use Const Assertions
```typescript
// ✅ GOOD
const REPORT_TYPES = ['session_note', 'assessment', 'progress_report'] as const;
type ReportType = typeof REPORT_TYPES[number];

// ❌ BAD
const REPORT_TYPES = ['session_note', 'assessment', 'progress_report'];
```

### React Component Guidelines

#### Server Components (Default)
```typescript
// app/participants/page.tsx
import { getParticipants } from '@/lib/db/participants';

export default async function ParticipantsPage() {
  const participants = await getParticipants();

  return (
    <div>
      <h1>Participants</h1>
      {participants.map(p => (
        <ParticipantCard key={p.id} participant={p} />
      ))}
    </div>
  );
}
```

#### Client Components (When Needed)
```typescript
// components/ParticipantFilter.tsx
'use client';

import { useState } from 'react';

export function ParticipantFilter() {
  const [filter, setFilter] = useState('');

  return (
    <input
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      placeholder="Search participants..."
    />
  );
}
```

#### Component Props
```typescript
// ✅ GOOD: Explicit interface
interface ParticipantCardProps {
  participant: Participant;
  onSelect?: (id: string) => void;
  className?: string;
}

export function ParticipantCard({
  participant,
  onSelect,
  className
}: ParticipantCardProps) {
  // ...
}

// ❌ BAD: Inline types, no interface
export function ParticipantCard({ participant, onSelect }: {
  participant: any;
  onSelect: any;
}) {
  // ...
}
```

### Styling Guidelines

#### Use Tailwind CSS Classes
```typescript
// ✅ GOOD
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
  Submit
</button>

// ❌ BAD: Inline styles
<button style={{ padding: '8px 16px', background: '#4F46E5' }}>
  Submit
</button>
```

#### Extract Repeated Patterns
```typescript
// ✅ GOOD: Reusable component
function Button({ children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

### File Naming Conventions

- **Components**: PascalCase (`ParticipantCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Pages**: lowercase (`participants/page.tsx`)
- **Types**: PascalCase (`Participant.ts`)
- **Tests**: Match source file with `.test.ts` suffix (`formatDate.test.ts`)

### Code Organization

```typescript
// ✅ GOOD: Organized imports
// 1. External dependencies
import { useState, useEffect } from 'react';
import { z } from 'zod';

// 2. Internal modules
import { getParticipants } from '@/lib/db/participants';
import { formatDate } from '@/lib/utils';

// 3. Components
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// 4. Types
import type { Participant } from '@/types';

// 5. Styles (if any)
import './styles.css';
```

---

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build)
- **ci**: CI/CD changes
- **revert**: Reverting previous commits

#### Examples

```bash
# Feature
git commit -m "feat(participants): add search and filter functionality"

# Bug fix
git commit -m "fix(reports): correct AI confidence calculation"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Performance
git commit -m "perf(dashboard): optimize participant list rendering"

# Multiple changes
git commit -m "feat(participants): add search functionality

- Add search input component
- Implement debounced search
- Add loading state
- Update tests

Closes #123"
```

### Commit Best Practices

- **Atomic Commits**: Each commit should represent a single logical change
- **Clear Messages**: Write clear, descriptive commit messages
- **Reference Issues**: Include issue numbers (e.g., "Closes #123")
- **Sign Commits**: Use GPG signing for commits (recommended)

---

## Pull Request Process

### Before Submitting

1. **Code Quality**
   - [ ] Code follows project style guidelines
   - [ ] No TypeScript errors (`npm run type-check`)
   - [ ] No linting errors (`npm run lint`)
   - [ ] Code is properly formatted (`npm run format`)

2. **Testing**
   - [ ] All existing tests pass (`npm test`)
   - [ ] New tests added for new features
   - [ ] Manual testing completed
   - [ ] Edge cases considered

3. **Documentation**
   - [ ] README updated (if needed)
   - [ ] JSDoc comments added for public APIs
   - [ ] CHANGELOG.md updated
   - [ ] Screenshots included (for UI changes)

4. **Security**
   - [ ] No sensitive data in commits
   - [ ] No security vulnerabilities introduced
   - [ ] Input validation implemented
   - [ ] Authentication/authorization checked

### Creating a Pull Request

1. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open Pull Request on GitHub**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing

## Related Issues
Closes #123
```

### PR Best Practices

- **Small PRs**: Keep PRs focused and reasonably sized (< 400 lines)
- **Clear Description**: Explain what, why, and how
- **Screenshots**: Include for UI changes
- **Link Issues**: Reference related issues
- **Respond Promptly**: Address review comments quickly

---

## Testing Requirements

### Test Coverage

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All critical user flows
- **E2E Tests**: Main application workflows

### Writing Tests

#### Unit Tests
```typescript
// ParticipantCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ParticipantCard } from './ParticipantCard';

describe('ParticipantCard', () => {
  it('renders participant information', () => {
    const participant = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      ndisNumber: '123456789',
    };

    render(<ParticipantCard participant={participant} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    const participant = { id: '1', firstName: '', lastName: '', ndisNumber: '' };

    render(<ParticipantCard participant={participant} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
```

#### Integration Tests
```typescript
// participants.integration.test.ts
describe('Participants API', () => {
  it('creates a new participant', async () => {
    const response = await fetch('/api/participants', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        ndisNumber: '123456789',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test ParticipantCard.test.tsx

# Run in watch mode
npm test -- --watch
```

---

## Documentation

### Code Comments

```typescript
/**
 * Generates an AI-powered clinical report for a participant.
 *
 * @param participantId - The UUID of the participant
 * @param type - The type of report to generate
 * @returns Promise resolving to the generated report
 * @throws {NotFoundError} If participant doesn't exist
 * @throws {UnauthorizedError} If user lacks permission
 *
 * @example
 * ```typescript
 * const report = await generateReport(
 *   'participant-uuid',
 *   'session_note'
 * );
 * ```
 */
async function generateReport(
  participantId: string,
  type: ReportType
): Promise<Report> {
  // Implementation
}
```

### Updating Documentation

When making changes, update relevant documentation:

- **README.md**: For user-facing changes
- **ARCHITECTURE.md**: For architectural changes
- **CLAUDE.md**: For AI development patterns
- **API.md**: For API changes
- **CHANGELOG.md**: For all changes

---

## Review Process

### Review Criteria

Reviewers will check:

1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it clean, readable, maintainable?
3. **Performance**: Are there any performance concerns?
4. **Security**: Are there security vulnerabilities?
5. **Tests**: Are tests comprehensive and passing?
6. **Documentation**: Is documentation updated?

### Review Timeline

- **Initial Review**: Within 2 business days
- **Follow-up Reviews**: Within 1 business day
- **Final Approval**: 2 approvals required for merge

### Addressing Feedback

1. **Be Receptive**: View feedback as learning opportunity
2. **Ask Questions**: If feedback is unclear, ask for clarification
3. **Make Changes**: Address all review comments
4. **Push Updates**: Push changes to the same branch
5. **Mark Resolved**: Mark conversations as resolved when addressed

---

## Questions?

If you have questions about contributing:

- **Technical Questions**: Open a GitHub Discussion
- **Process Questions**: Email dev@jddigitalsystems.com
- **Security Issues**: See [SECURITY.md](./SECURITY.md)

---

## Recognition

Contributors are recognized in:
- [CHANGELOG.md](./CHANGELOG.md) release notes
- Annual contributor list
- Project website (coming soon)

Thank you for contributing to Praxis AI and helping improve healthcare workflows!

---

**Maintained by**: JD Digital Systems Development Team
**Last Updated**: January 2026
