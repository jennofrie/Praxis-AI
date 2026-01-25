# Senior NDIS Planner Feature Overview

## What It Does
- Two tools in one screen: Section 34 Auditor (AI audit of NDIS docs) and Change of Circumstances (CoC) Eligibility Assessor with SC vs participant views.
- Accepts pasted text or uploaded PDFs/Word docs, invokes Supabase Edge Functions for analysis, renders scored findings, and exports polished PDFs.
- Saves audits/assessments to Supabase tables for history panels; optional RAG upload to Spectra storage with duplicate detection.

## Frontend Entry Point
- Page: [src/app/(authenticated)/toolkit/page.tsx](src/app/(authenticated)/toolkit/page.tsx) - Main toolkit page with mode selection
- Components:
  - [src/components/toolkit/PlannerMode.tsx](src/components/toolkit/PlannerMode.tsx) - Section 34 Auditor tab (upload, AI calls, rendering, history panels)
  - [src/components/toolkit/CoCMode.tsx](src/components/toolkit/CoCMode.tsx) - Change of Circumstances Assessor tab
  - [src/components/toolkit/AIProcessingButton.tsx](src/components/toolkit/AIProcessingButton.tsx) - Animated processing button with stage indicators
- PDF export: [src/lib/pdf-export.ts](src/lib/pdf-export.ts) - jsPDF generation for both Section 34 and CoC reports
- PDF parsing: [src/lib/pdf-parser.ts](src/lib/pdf-parser.ts) - Text extraction from uploaded PDFs
- Type definitions: [src/types/senior-planner.ts](src/types/senior-planner.ts) - TypeScript interfaces for audit and CoC results

## Section 34 Auditor Flow
1. **Input**: User selects document type and either pastes text or uploads `.txt/.docx/.pdf` (PDF encoded base64). State: `documentContent`, `fileData`, `fileMimeType`, `documentType`, `documentName`.
2. **Submit**: `handleAudit()` builds request with text or PDF and calls Supabase Edge Function `senior-planner-audit` via `supabase.functions.invoke`. Loading flags `isAuditing` etc.
3. **Response Shape** (`AuditResult`): overallScore, status, sub-scores (compliance/nexus/vfm/evidence/significantChange), plannerSummary, strengths[], improvements[], redFlags[], languageFixes[], plannerQuestions[]. Special path `contentRestriction` yields security-blocked result.
4. **Persistence**: On success, inserts into `report_audits` table (fields: user_id, document_type/name/content, scores, status, strengths, improvements, red_flags, language_fixes, planner_questions, planner_summary).
5. **Display**: Gauges, strengths/improvements, red flags, language converter, planner questions, security messaging. History side panel loads last 20 audits from `report_audits` and can hydrate UI with a selected record.
6. **Exports/Sharing**:
   - `exportSeniorPlannerPdf(auditResult, documentName, docTypeLabel, skipDownload?)` renders jsPDF report; `skipDownload` allows reuse for RAG upload.
   - Super-admin only "Save to RAG" triggers duplicate check (`rag-agent` Edge Function action `check_duplicate`); if OK uploads PDF to Supabase bucket `spectra-reports/reports/` and calls `rag-agent` action `trigger_indexing`.

## CoC Eligibility Assessor Flow
1. **Input**: Circumstances textarea + optional triggers (`COC_TRIGGER_CATEGORIES`) and evidence upload (PDF base64 or docx/txt appended to text). State mirrors Section 34 (`cocCircumstances`, `cocFileData`, etc.).
2. **Import**: Can pull content/file from Section 34 tab for reuse.
3. **Submit**: `handleCoCAssess()` calls Supabase Edge Function `coc-eligibility-assessor` with circumstances, trigger labels, and optional PDF. Handles minimum detail guardrails and security-blocked path.
4. **Response Shape** (`CoCAssessmentResult`): confidenceScore, eligibilityVerdict (`likely_eligible|possibly_eligible|not_eligible|security_blocked`), recommendedPathway, scReport, participantReport, evidenceSuggestions[], ndisReferences[], nextSteps[].
5. **Persistence**: Inserts into `coc_assessments` table (user_id, description, triggers, document_names, scores, verdict, pathway, reports, evidence_suggestions, ndis_references, next_steps). History side panel fetches last 10 records and can hydrate UI.
6. **Display**: Verdict gauges, dual report views (SC vs participant), evidence suggestions with priority, action timeline, NDIS references.
7. **Export**: `exportCoCAssessmentPdf(cocResult, cocViewMode)` produces SC/participant formatted PDFs.

## Permissions / Roles
- `usePermissions` maps subscription tiers (`lite|pro|premium|legacy_premium`) to feature flags; super-admin email gets RAG/admin rights.
- Current page redirect uses `!permissions.canAccessBudgetForecaster` before load; adjust to `canAccessSeniorPlanner` when porting.

## Supabase Dependencies
- Edge Functions: `senior-planner-audit`, `coc-eligibility-assessor`, `rag-agent` (actions `check_duplicate`, `trigger_indexing`).
- Tables: `report_audits` (audit history), `coc_assessments` (CoC history), `profiles` (subscription tier). Auth required for inserts/uploads.
- Storage bucket: `spectra-reports` with `reports/` prefix for PDF uploads.

## File Handling & Validation
- Uploads: `.pdf` -> base64; `.docx` via `mammoth.extractRawText`; `.txt` via `File.text()`. Guards for short inputs, unsupported types, and legacy `.doc` prompt.
- Content restriction: both tools render security-blocked UI and inject red flags/questions when Edge Function signals non-NDIS content.

## PDF Generation Highlights
- jsPDF layout uses ASCII sanitization; gauges drawn via line segments; glossary of NDIS terms appended; returns `{ filename, pdfBlob }` for download or RAG upload.

## Integration Tips (porting to another B2B SaaS)
1. **Replicate Edge Functions**: Implement endpoints compatible with the request/response shapes above; preserve `contentRestriction` flag for guardrails.
2. **Database**: Create `report_audits` and `coc_assessments` schemas with JSONB fields for arrays and text for summaries. Ensure auth policies allow per-user access.
3. **Storage/RAG**: Provide a bucket and optional duplicate-check + indexing trigger; adjust `rag-agent` names if your stack differs.
4. **Permissions**: Replace `usePermissions` with your auth/plan system; gate UI + redirects on your flags.
5. **UI**: Reuse the React component structure or port the state machine: inputs -> invoke -> persist -> render -> export/history.
6. **PDF**: Keep `exportSeniorPlannerPdf` API the same to reuse download and RAG upload flows.

## Key Files
- [src/pages/SeniorPlanner.tsx](src/pages/SeniorPlanner.tsx)
- [src/utils/seniorPlannerPdfExport.ts](src/utils/seniorPlannerPdfExport.ts)
- [src/utils/cocAssessmentPdfExport.ts](src/utils/cocAssessmentPdfExport.ts)
- [src/lib/ragUpload.ts](src/lib/ragUpload.ts)
- [src/hooks/usePermissions.tsx](src/hooks/usePermissions.tsx)
