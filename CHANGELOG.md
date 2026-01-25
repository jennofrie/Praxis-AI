# Changelog

All notable changes to the Praxis AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **FCA Pipeline Intake Enhancement** (2026-01-25)
  - Extended `FCASessionData` interface with comprehensive intake fields
  - Added `sessionDate`, `sessionTime`, `clinicianName`, `sessionType`, `location` fields
  - Added optional fields: `referralReason`, `referrerContact`, `intakeNotes`, `rawNotes`
  - Created `IntakeAttachment` interface for file upload support (PDF, DOCX, TXT)
  - Implemented auto-domain mapping when intake notes are present
  - Added persistence of raw notes across Domain Mapper workflow
  - Prepared foundation for Supabase storage integration

### Changed
- **Domain Mapper Component**
  - Added `initialNotes` and `autoAnalyze` props for seamless workflow
  - Auto-triggers domain mapping when notes are provided from intake
  - Persists raw notes in session data for continuity
  - Enhanced notes state management with proper data flow

### Fixed
- Build error: Module not found `@supabase/auth-helpers-nextjs`
  - Migrated from deprecated package to `@supabase/ssr`
  - Updated AdminContext to use `createClient` from `@/lib/supabase/client`
- TypeScript errors across multiple files
  - Removed unused imports (lucide-react icons)
  - Added null coalescing operators for type safety
  - Fixed string | undefined type issues
  - Excluded Supabase edge functions from TypeScript checking

### Planned Features
- Session Intake form expansion with NDIS best practices
- File upload UI with PDF/DOCX/TXT parsing
- Supabase persistence for intake sessions
- Required field validation with NDIS number pattern enforcement
- Auto-save and resume draft functionality
- Consent tracking (deferred)

---

## [0.1.0] - 2026-01-25

### Added
- Initial project setup with Next.js 16.1.4
- TypeScript 5 configuration
- Tailwind CSS 4 with custom design system
- Project structure and folder organization
- UI/UX design mockups in `.designs/` folder
  - Dashboard interface
  - Participant management
  - Reports & documentation
  - AI Assistant interface
  - Toolkit interface
  - NDIS Plans interface
  - General settings
  - User profile
- Documentation files:
  - README.md with project overview
  - ARCHITECTURE.md with system design
  - CLAUDE.md with AI development guidelines
  - CHANGELOG.md (this file)
  - CONTRIBUTING.md with contribution guidelines
  - SECURITY.md with security policies
- Custom color palette for clinical workflows
- Dark mode support
- Lucide React icon library integration
- ESLint configuration
- Git repository initialization

### Technical Specifications
- **Framework**: Next.js 16.1.4 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Design System**: Custom clinical-focused palette

### Design System
- Primary color: Indigo (#4F46E5)
- Inter font family for all text
- Responsive breakpoints (mobile, tablet, desktop)
- Light and dark theme support
- Accessibility-first component design

---

## Version History

### Version Numbering

Praxis AI follows Semantic Versioning:

- **MAJOR** version (X.0.0): Incompatible API changes or major architectural changes
- **MINOR** version (0.X.0): New features in a backwards-compatible manner
- **PATCH** version (0.0.X): Backwards-compatible bug fixes

### Release Schedule

- **Major releases**: Every 6-12 months
- **Minor releases**: Every 4-8 weeks
- **Patch releases**: As needed for critical fixes

---

## Change Categories

Changes are categorized as follows:

- **Added**: New features or functionality
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed in future versions
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes

---

## Upcoming Releases

### [0.2.0] - Planned Q1 2026

#### Features
- [ ] User authentication (email/password)
- [ ] Organization management (multi-tenancy)
- [ ] Basic participant CRUD operations
- [ ] Dashboard with real-time metrics
- [ ] Profile management

#### Technical
- [ ] Database schema implementation (PostgreSQL)
- [ ] Prisma ORM integration
- [ ] Authentication middleware
- [ ] API routes for core entities

### [0.3.0] - Planned Q2 2026

#### Features
- [ ] AI-powered report generation (Session Notes)
- [ ] Report review and approval workflow
- [ ] Document upload and storage
- [ ] Session management

#### Technical
- [ ] Claude API integration
- [ ] AWS S3 integration for file storage
- [ ] Background job processing
- [ ] Confidence scoring algorithm

### [0.4.0] - Planned Q2 2026

#### Features
- [ ] NDIS plan management
- [ ] Compliance dashboard
- [ ] Audit logging UI
- [ ] Advanced search and filtering

#### Technical
- [ ] Full-text search implementation
- [ ] Advanced analytics queries
- [ ] Audit log schema and ingestion

### [1.0.0] - Planned Q3 2026

#### Features
- [ ] Complete AI Assistant with multiple report types
- [ ] Mobile-responsive design across all pages
- [ ] Email notifications
- [ ] Comprehensive reporting system
- [ ] Advanced user roles and permissions

#### Technical
- [ ] Performance optimization for 1,000+ users
- [ ] Load testing and optimization
- [ ] Comprehensive test coverage (>80%)
- [ ] Production deployment on AWS

---

## Migration Guides

### Upgrading from 0.1.0 to 0.2.0

When 0.2.0 is released, this section will provide:
- Database migration scripts
- Configuration changes required
- Breaking changes (if any)
- Step-by-step upgrade instructions

---

## Security Updates

All security-related updates are documented in [SECURITY.md](./SECURITY.md).

### Security Patch Policy

- **Critical vulnerabilities**: Patched within 24 hours
- **High severity**: Patched within 7 days
- **Medium severity**: Patched in next minor release
- **Low severity**: Patched in next major release

---

## Deprecation Notices

No features are currently deprecated. Deprecation notices will appear here at least 3 months before removal.

---

## Contributors

### Core Team (JD Digital Systems)
- Architecture & Design Team
- Development Team
- QA & Testing Team
- DevOps Team

### Special Thanks
- Design inspiration from modern healthcare applications
- Open-source community for excellent tooling
- Early adopters providing valuable feedback

---

## Release Process

1. **Development**: Feature branches merged to `develop`
2. **Testing**: QA testing on staging environment
3. **Release Candidate**: Tag release candidate (e.g., v0.2.0-rc.1)
4. **User Acceptance Testing**: Selected users test RC
5. **Production Release**: Merge to `main` and deploy
6. **Changelog Update**: Document changes in this file
7. **Communication**: Announce release to users

---

## Feedback and Bug Reports

Found a bug or have a feature request?

- **Bug Reports**: Create an issue in the project repository
- **Feature Requests**: Contact product@jddigitalsystems.com
- **Security Issues**: See [SECURITY.md](./SECURITY.md)

---

## Links

- [Project Homepage](https://praxis-ai.com)
- [Documentation](./README.md)
- [Architecture](./ARCHITECTURE.md)
- [Security Policy](./SECURITY.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [JD Digital Systems](https://jddigitalsystems.com)

---

**Maintained by**: JD Digital Systems Development Team
**Last Updated**: January 25, 2026

---

## Notes

This changelog is automatically updated with each release. Historical versions are preserved for reference and auditing purposes.

For detailed commit history, please refer to the Git repository log.
