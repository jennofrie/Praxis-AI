# Changelog

All notable changes to the Praxis AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **SC Toolkit Backend Infrastructure** (2026-01-28)
  - Deployed 7 new Supabase Edge Functions for all SC Toolkit features:
    * `synthesize-report` - Allied health report synthesis with premium/standard tiering
    * `coc-cover-letter-generator` - CoC cover letter structured JSON generation
    * `generate-justification` - LC-AT justification with Section 34 criteria (premium tier)
    * `plan-management-expert` - NDIS plan management chatbot with document analysis
    * `analyze-text` - Text-to-case-note conversion for Visual Case Notes
    * `analyze-image` - Multimodal image-to-case-note using gemini-1.5-flash
    * `generate-weekly-summary` - Weekly activity summary for Support Coordinators
  - Applied database migration 009: SC Toolkit tables
    * `synthesized_reports` - Stores Report Synthesizer outputs with template data
    * `coc_cover_letter_history` - CoC cover letter generation history with deduplication
    * `budgets` - NDIS budget tracking with Core/Capacity/Capital breakdown
    * `budget_snapshots` - Point-in-time budget forecasts for comparison
    * `plan_management_queries` - Plan Management Expert chat history
    * `activity_logs` - User activity logging for weekly summaries
    * `case_notes_history` - Visual Case Notes generation history (text & image)
  - All tables configured with Row Level Security (RLS) policies
  - Implemented user-scoped data isolation via `auth.uid()`
  - Added indexes on `user_id` + `created_at DESC` for optimal query performance
  - Created `updated_at` triggers for `synthesized_reports` and `budgets`
  - Shared utility modules: `_shared/cors.ts` and `_shared/gemini.ts` for all Edge Functions
  - Model tiering: Premium (gemini-2.5-pro), Standard (gemini-2.0-flash), Flash (gemini-2.0-flash)

- **AI Processing Button Component** (2026-01-25)
  - Created reusable `AIProcessingButton` component with professional animations
  - Stage-based progress indicators showing real-time processing steps
  - Visual effects: gradient glow, shimmer animation, floating particles, progress bar
  - Two variants: Emerald (for Section 34 Audit) and Indigo (for CoC Assessment)
  - Different stage messages for audit vs. assessment workflows
  - Custom CSS keyframe animations: shimmer, float, pulse-ring, spin-slow

- **Enhanced Reports & Docs Page** (2026-01-25)
  - Real-time data fetching from `report_audits` and `coc_assessments` Supabase tables
  - Participant name extraction from document names with intelligent parsing
  - Participant initials display format (e.g., "J.D." instead of full names or photos)
  - Renamed "AI Confidence" to "Spectra Confidence" across UI
  - "Final" status badge for completed Planner and CoC assessments
  - Tab-based filtering: All Reports, Section 34 Audits, CoC Assessments
  - Report Summary widget showing counts by type
  - Recent Activity widget with time-ago formatting
  - Search functionality across participant names and document names
  - Color-coded status indicators: Final (green), Review (yellow), Critical (red), Blocked (gray)

- **FCA Pipeline Intake Enhancement** (2026-01-25)
  - Extended `FCASessionData` interface with comprehensive intake fields
  - Added `sessionDate`, `sessionTime`, `clinicianName`, `sessionType`, `location` fields
  - Added optional fields: `referralReason`, `referrerContact`, `intakeNotes`, `rawNotes`
  - Created `IntakeAttachment` interface for file upload support (PDF, DOCX, TXT)
  - Implemented auto-domain mapping when intake notes are present
  - Added persistence of raw notes across Domain Mapper workflow
  - Prepared foundation for Supabase storage integration

### Changed
- **SC Toolkit Sidebar Badge** (2026-01-28)
  - Changed badge from "WIP" (Work in Progress) to "NEW"
  - Reflects completion of backend infrastructure deployment
  - All 9 SC Toolkit features now fully operational with Edge Function support

- **Planner Mode (Section 34 Auditor)**
  - Replaced standard button with animated `AIProcessingButton`
  - Shows 5 processing stages: Scanning → Analyzing Section 34 → Evaluating evidence → 3-pass analysis → Generating report
  - Improved user feedback during AI processing with visual progress

- **CoC Mode (Change of Circumstances Assessor)**
  - Replaced standard button with animated `AIProcessingButton`
  - Shows 5 processing stages: Processing circumstances → Analyzing triggers → Evaluating eligibility → Determining pathway → Generating reports
  - Enhanced UX with professional animations and progress tracking

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
- AIProcessingButton TypeScript strict null checks
  - Added bounds checking for stage array access
  - Added non-null assertions for safe array element access

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
**Last Updated**: January 28, 2026

---

## Notes

This changelog is automatically updated with each release. Historical versions are preserved for reference and auditing purposes.

For detailed commit history, please refer to the Git repository log.
