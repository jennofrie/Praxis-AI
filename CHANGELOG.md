# Changelog

All notable changes to Praxis AI are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Enterprise Senior Planner Audit — Deep Upgrade** (2026-02-23)
  - Migrated Edge Function to **Gemini 2.5 Pro** via direct REST API with `responseMimeType: 'application/json'` and `thinkingBudget: 1024`
  - JSON sanitisation layer (`sanitizeJson`, `parseJsonSafe`) to strip thinking-token contamination and trailing commas
  - Rich structured output types: `StrengthItem`, `ImprovementItem`, `RedFlagItem`, `MainstreamInterfaceCheck`
  - `LanguageFix` extended with optional `quoteLocation`, `category`, and `section34Impact` fields
  - `AuditResult.strengths / improvements / redFlags` updated to union arrays (`(RichType | string)[]`) for backward compatibility
  - System prompt hardened with:
    - **§34(1)(e)**: Informal Supports / Reasonable Expectation — carer capacity checks, respite context
    - **§34(1)(f)**: Most Appropriate Funder (APTOS) & Ordinary Living Costs — concrete examples
    - `QUOTE INTEGRITY RULES (MANDATORY)` — 6 rules enforcing verbatim-only quotes with empty-string fallback
    - `PROMPT INJECTION DEFENCE` — 6 security rules with red-flag trigger on injection attempts
    - `FINAL SELF-CHECK (REQUIRED BEFORE RESPONDING)` — 8 validation rules before output
    - Expanded PASS 1 Excluded Supports checklist with annotated examples
    - Updated weighted scoring table with all §34(a)–(f) criteria explicit
  - `evidenceQuality` score field aliased to `evidence` with fallback mapping in index.ts
  - Shared `_shared/gemini.ts` upgraded: `generateWithTier()` REST API, filter thinking parts, `sanitizeJson`/`parseJsonSafe` helpers

- **Enterprise Senior Planner PDF — Complete Rewrite** (2026-02-23)
  - Navy/blue clinical theme: primary `#142341`, accent `#2562B4`
  - Gradient navy header (25mm) with tool title and A4 layout
  - Score circle (13mm radius) with segmented arc colouring
  - Horizontal score gauges in 2-column layout for all 5 sub-scores
  - Strengths: green left accent bar, category badges, §34 reference badges, italic participant quotes
  - Improvements: amber left accent bar, severity badges (Critical / High / Medium / Low, colour-coded)
  - Red Flags: red left accent bar + red background, risk level badges
  - Language Converter: two-column table with red ORIGINAL / green SUGGESTED column headers
  - Planner Questions: purple left accent bar with numbered circle bullets
  - Mainstream Interface Check: 4 risk domain grid boxes (Health / Education / Housing / Justice)
  - NDIS Glossary: 15 entries in two-column striped table
  - `ensureSpace()` helper for smart page breaks
  - Handles both `string[]` and rich object arrays for all three finding types

- **Report Synthesizer — Full Rebuild** (2026-02-23)
  - Edge Function `synthesize-report` completely rewritten:
    - Accepts `reportText`, `coordinatorNotes`, `personaId`, `participantName`, `ndisNumber`, `userId`
    - 5 full professional NDIS persona system prompts: **SC Level 2**, **Senior SC Level 3**, **Plan Review Coordinator**, **Occupational Therapist**, **Progress Report Writer**
    - Gemini 2.5 Pro via REST API; `maxOutputTokens: 65,536`; temperature 0.3 / topP 0.95 / topK 40
    - Saves to `synthesized_reports` with persona, participant name, model metadata
  - Next.js API route `sc-report-synthesizer` fixed critical bug: `reportText || reportContent` field fallback
  - New `src/lib/report-synthesizer-pdf.ts`: navy header, participant info box, section cards, SC signature block, page numbers
  - UI completely rebuilt (`sc-toolkit/report-synthesizer/page.tsx`):
    - Left column (40%): drag-and-drop multi-file upload (PDF / DOCX / TXT, up to 10 files), participant details, 5 persona selector buttons, coordinator notes, history panel (last 10 from Supabase)
    - Right column (60%): collapsible section cards, copy + PDF export, 30 rotating NDIS tips, 7 status messages
    - Section parser handles ALL CAPS headings from all 5 personas
  - New `PersonaId` type union and `SynthesisHistoryItem` interface in `src/types/sc-toolkit.ts`

- **Migration 010 — Report Synthesizer Schema** (2026-02-23)
  - `ALTER TABLE synthesized_reports ADD COLUMN IF NOT EXISTS persona_id TEXT DEFAULT 'sc-level-2'`
  - Added `participant_name TEXT` and `ndis_number TEXT` columns
  - `cleanup_old_synthesized_reports()` trigger: auto-keeps last 10 reports per user
  - `idx_synthesized_reports_persona` index on `(user_id, persona_id, created_at DESC)`

- **Migration 011 — AI Rate Limits & Presence** (2026-02-23)
  - `ai_rate_limits` table: sliding-window 20 req/hr per user via `auth.uid()`
  - `last_seen` column added to `profiles` — updated every 60 seconds by `PresenceProvider`
  - Active Sessions panel on Audits page: Online (< 5 min) / Idle (5–15 min) / Offline (> 15 min)
  - AI security layer (`src/lib/ai-security.ts`): 13-pattern prompt injection detection, 2000-char input cap
  - Audit logging wired to all AI invocations via `POST /api/audit` → `audit_logs` table

- **SC Toolkit Backend Infrastructure** (2026-01-28)
  - Deployed 7 new Supabase Edge Functions:
    - `synthesize-report` — Allied health report synthesis with premium/standard tiering
    - `coc-cover-letter-generator` — CoC cover letter structured JSON generation
    - `generate-justification` — LC-AT justification with Section 34 criteria (premium tier)
    - `plan-management-expert` — NDIS plan management chatbot with document analysis
    - `analyze-text` — Text-to-case-note conversion for Visual Case Notes
    - `analyze-image` — Multimodal image-to-case-note via Gemini Flash
    - `generate-weekly-summary` — Weekly activity summary for Support Coordinators
  - Applied database migration 009 — SC Toolkit tables:
    - `synthesized_reports`, `coc_cover_letter_history`, `budgets`, `budget_snapshots`
    - `plan_management_queries`, `activity_logs`, `case_notes_history`
  - All tables configured with Row Level Security (RLS) policies scoped to `auth.uid()`
  - Indexes on `user_id + created_at DESC` for optimal query performance
  - `updated_at` triggers on `synthesized_reports` and `budgets`
  - Shared utility modules: `_shared/cors.ts` and `_shared/gemini.ts`
  - Model tiering: Premium (Gemini 2.5 Pro), Standard/Flash (Gemini 2.5 Flash)

- **AI Processing Button Component** (2026-01-25)
  - Reusable `AIProcessingButton` with stage-based progress indicators
  - Visual effects: gradient glow, shimmer animation, floating particles, progress bar
  - Two variants: Emerald (Section 34 Audit) and Indigo (CoC Assessment)
  - Custom CSS keyframe animations: shimmer, float, pulse-ring, spin-slow

- **Enhanced Reports & Docs Page** (2026-01-25)
  - Real-time data fetching from `report_audits` and `coc_assessments` tables
  - Participant initials display format (e.g., "J.D." instead of full names)
  - Tab-based filtering: All Reports / Section 34 Audits / CoC Assessments
  - Report Summary widget with counts by type and Recent Activity with time-ago formatting
  - Color-coded status: Final (green) / Review (yellow) / Critical (red) / Blocked (gray)

- **FCA Pipeline Intake Enhancement** (2026-01-25)
  - Extended `FCASessionData` interface: `sessionDate`, `sessionTime`, `clinicianName`, `sessionType`, `location`
  - Optional fields: `referralReason`, `referrerContact`, `intakeNotes`, `rawNotes`
  - `IntakeAttachment` interface for PDF / DOCX / TXT upload support
  - Auto-domain mapping when intake notes are present
  - Raw notes persistence across Domain Mapper workflow

### Changed

- **SC Toolkit Sidebar Badge** (2026-01-28)
  - Changed badge from "WIP" to "NEW" — all 9 tools fully operational with Edge Function support

- **Planner Mode (Section 34 Auditor)**
  - Replaced standard button with animated `AIProcessingButton`
  - 5 processing stages: Scanning → Analysing Section 34 → Evaluating evidence → 3-pass analysis → Generating report

- **CoC Mode (Change of Circumstances Assessor)**
  - Replaced standard button with animated `AIProcessingButton`
  - 5 processing stages: Processing circumstances → Analysing triggers → Evaluating eligibility → Determining pathway → Generating reports

- **Domain Mapper Component**
  - Added `initialNotes` and `autoAnalyze` props for seamless FCA Pipeline workflow
  - Auto-triggers domain mapping when notes are provided from intake
  - Enhanced notes state management with proper data flow

### Fixed

- **NDIS Plans page `Error loading plans: {}`** (2026-02-23)
  - Root cause: Supabase query selected `full_name` but `participants` table has `first_name` + `last_name`
  - Fixed query to select `first_name, last_name`; updated `NDISPlanDB` interface and transform to template literal

- **PDF.js worker version mismatch** (2026-02-23)
  - Error: `"API version '4.10.38' does not match Worker version '4.0.379'"`
  - Fix: `postinstall` script copies matching worker from `node_modules`; pinned `pdfjs-dist` to `4.10.38`

- **Gemini model deprecation** (2026-02-23)
  - `gemini-2.0-flash-exp` returned 404; `gemini-1.5-flash` sunset
  - Migrated all Edge Functions and `src/lib/gemini.ts` to Gemini 2.5 Pro (premium) and 2.5 Flash (standard)

- **Gemini 2.5 Flash JSON parse failure** (2026-02-23)
  - Thinking tokens contaminated raw JSON responses causing `JSON.parse` to throw
  - Fix: REST API with `responseMimeType: 'application/json'` + `thinkingBudget: 1024` + filter thinking parts + `sanitizeJson`

- **Supabase `config.toml` `health_timeout` key rejected** (2026-02-23)
  - `supabase link` failed with `'db' has invalid keys: health_timeout`
  - Fix: Commented out unsupported `health_timeout` key in `supabase/config.toml`

- **jsPDF `roundedRect` invalid arguments crash** (2026-02-23)
  - Score of 0 or NaN produced negative rectangle width
  - Fix: `Math.max(0, Math.min(100, score || 0))` guard + `if (scoreWidth > 0)` conditional before drawing

- **`TypeError: Cannot read properties of undefined (reading 'toUpperCase')`** (2026-02-23)
  - `fix.category` was undefined in language fix objects from AI response
  - Fix: `(fix.category || fix.section34Impact || 'GENERAL').toUpperCase()` safe fallback chain

- **Supabase migration history conflict** (2026-02-23)
  - `007_profiles_role_title_phone.sql` caused `schema_migrations_pkey` duplicate key error
  - Fix: Renamed to `0075_profiles_role_title_phone.sql`; created placeholder for untracked remote migration; ran `supabase migration repair --status applied`

- Build error: Module not found `@supabase/auth-helpers-nextjs`
  - Migrated from deprecated package to `@supabase/ssr`
  - Updated AdminContext to use `createClient` from `@/lib/supabase/client`

- TypeScript strict null errors across multiple files
  - Removed unused imports, added null coalescing operators, fixed `string | undefined` type issues
  - Excluded Supabase Edge Functions directory from TypeScript project checking

- `AIProcessingButton` TypeScript strict null checks
  - Added bounds checking for stage array access
  - Added non-null assertions for safe array element access

---

## [0.1.0] — 2026-01-25

### Added

- Initial project setup with Next.js 16.1.4, React 19.2.3, TypeScript 5
- Tailwind CSS 4 with custom clinical design system
- App Router structure with authenticated route group
- Dashboard, Participants, Reports, AI Assistant, Toolkit, NDIS Plans, Settings, Profile pages
- Supabase integration: authentication, PostgreSQL, Row Level Security
- Dark mode support with CSS variable system
- Lucide React icon library
- ESLint configuration
- Initial documentation suite: README, ARCHITECTURE, CHANGELOG, CONTRIBUTING, SECURITY

### Technical Specifications

| Component | Version |
|---|---|
| Next.js | 16.1.4 |
| React | 19.2.3 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Supabase JS | 2.91.1 |

---

## Upcoming

### [0.2.0] — Planned Q3 2026

- [ ] Mobile-responsive audit across all remaining pages
- [ ] Voice-to-text clinical note dictation
- [ ] Multi-tenancy organisation management
- [ ] Predictive participant analytics
- [ ] Integration with PRODA / My Aged Care APIs

---

## Version Numbering

Praxis AI follows Semantic Versioning:

- **MAJOR** (X.0.0): Incompatible architectural changes
- **MINOR** (0.X.0): New features in a backwards-compatible manner
- **PATCH** (0.0.X): Backwards-compatible bug fixes

---

## Change Categories

- **Added**: New features or functionality
- **Changed**: Changes to existing functionality
- **Deprecated**: Features scheduled for removal
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes

---

## Security Updates

Security-related updates are documented in [SECURITY.md](./SECURITY.md).

| Severity | Response Time |
|---|---|
| Critical | Within 24 hours |
| High | Within 7 days |
| Medium | Next minor release |
| Low | Next major/minor release |

---

## Links

- [Project Homepage](https://praxis-ai.com)
- [JD Digital Systems](https://jddigitalsystems.com)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security Policy](./SECURITY.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

---

**Maintained by**: JD Digital Systems Development Team
**Last Updated**: May 2026
