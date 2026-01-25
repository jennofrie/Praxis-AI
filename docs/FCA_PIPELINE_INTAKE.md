# FCA Pipeline - Session Intake Enhancement

**Created**: 2026-01-25  
**Status**: In Progress  
**Related Components**: `toolkit/fca-pipeline`

---

## Overview

This document outlines the enhanced Session Intake workflow for the FCA (Functional Capacity Assessment) Pipeline. The improvements focus on capturing comprehensive participant and session data aligned with NDIS/OT best practices.

---

## Current Implementation

### Session Data Structure

The `FCASessionData` interface has been extended to capture:

#### Required Fields (Gate Progression)
- `participantName` - Full participant name
- `ndisNumber` - NDIS number (strict 9-digit pattern validation)
- `sessionDate` - Session date (ISO format)
- `sessionTime` - Session time
- `clinicianName` - Name of conducting clinician
- `sessionType` - Type of session (Initial, Review, Follow-up, Post-incident, or custom)
- `location` - Session location (Home, Clinic, School, Telehealth, or custom)

#### Clinical Fields
- `diagnosis` - Primary diagnosis (free text with ICD/DSM guidance)
- `observations` - Domain-mapped observations (Record<string, string[]>)
- `goals` - Session goals array

#### Optional Context Fields
- `referralReason` - Session focus/reason for referral
- `referrerContact` - Referrer name, role, and contact
- `intakeNotes` - Free-text intake notes
- `rawNotes` - Raw clinical notes (passed to Domain Mapper)

#### Attachments
- `attachments` - Array of `IntakeAttachment` objects supporting:
  - PDF (.pdf)
  - Microsoft Word (.docx, .doc)
  - Plain text (.txt)

---

## Attachment Schema

```typescript
export interface IntakeAttachment {
  name: string;           // Original filename
  path: string;           // Supabase Storage path
  mimeType: string;       // MIME type
  size: number;           // File size in bytes
  uploadedAt: string;     // ISO timestamp
  extractedText?: string; // Parsed text content (optional)
}
```

**Storage Strategy**: Files stored in Supabase Storage under per-user folders, linked to draft records.

---

## Workflow Enhancements

### 1. Domain Mapper Integration

**Auto-analyze Feature**:
- When intake notes are present, Domain Mapper automatically triggers domain mapping
- `initialNotes` prop pre-fills raw notes textarea
- `autoAnalyze` prop runs AI mapping on component mount (if notes exist)

**Data Flow**:
```
Intake (capture notes) → Domain Mapper (auto-analyze) → Mapped Domains → Narrative
```

### 2. Persistence Strategy

**Draft Sessions**:
- Save to Supabase `intake_sessions` table (keyed by user)
- Auto-save on field change (debounced)
- Resume last draft on page load

**API Routes**:
- `POST /api/intake/save-draft` - Save current intake state
- `GET /api/intake/resume` - Load last draft session
- `DELETE /api/intake/discard` - Delete draft

---

## Validation Rules

### NDIS Number
- **Pattern**: 9 digits (e.g., `430123456`)
- **Validation**: Regex `/^\d{9}$/`
- **Display**: Strip spaces, validate on blur
- **Error**: Inline error state with helper text

### Required Field Gating
- Disable "Next" button until all required fields pass validation
- Show inline error states for invalid/empty fields
- Helper text for format requirements

### File Upload
- **Accepted Types**: `.pdf`, `.docx`, `.doc`, `.txt`
- **Max Size**: TBD (recommend 10MB per file)
- **Display**: List with filename, size, remove button
- **Storage**: Supabase Storage → per-user folder

---

## UI/UX Improvements

### Form Sections
1. **Participant Information**
   - Name, NDIS number

2. **Session Details**
   - Date, time, clinician, session type, location

3. **Referral & Context**
   - Referral reason, referrer contact

4. **Notes & Attachments**
   - Free-text intake notes
   - File upload control
   - "Save draft" and autosave status

### Helper Text Examples
- **NDIS Number**: "Use 9-digit NDIS number format (e.g., 430123456)"
- **Session Type**: "Select or enter custom session type"
- **Diagnosis**: "Use current ICD-10/DSM-5 terminology if available"

### Accessibility
- All inputs labeled with `<label>` elements
- Error states announced with `aria-invalid` and `aria-describedby`
- File upload keyboard accessible

---

## NDIS/OT Best Practices

### Essential Intake Fields (References)
1. **Participant Identifiers**: Name, NDIS number (or "Unknown/Not provided" flag)
2. **Session Metadata**: Date, time, type, setting (compliance & audit trail)
3. **Clinical Context**: Diagnosis, referral reason, session focus
4. **Prior Evidence**: Upload prior reports/referrals to reduce rework
5. **Early Notes Capture**: Feed domain mapping to avoid double entry

### Compliance Considerations
- **Audit Trail**: Capture session metadata for regulatory reporting
- **Privacy**: File uploads encrypted at rest (Supabase Storage default)
- **Consent**: Deferred for now (future enhancement)

---

## Implementation Roadmap

### ✅ Phase 1: Schema & Type Updates (Completed)
- Extended `FCASessionData` interface
- Created `IntakeAttachment` interface
- Updated Domain Mapper props and data flow

### 🚧 Phase 2: Intake Form UI (In Progress)
- Expand IntakeStep component with new fields
- Add session type/location dropdowns with custom entry
- Implement date/time pickers
- Add file upload control

### 📋 Phase 3: Validation & Gating (Planned)
- NDIS number pattern validation
- Required field checks with inline errors
- Disable "Next" until validation passes

### 📋 Phase 4: Persistence (Planned)
- Create Supabase `intake_sessions` table
- Implement draft save/resume API routes
- Add autosave with debounce
- File upload to Supabase Storage

### 📋 Phase 5: Auto-mapping (Planned)
- Implement auto-run domain mapping on intake submit
- Parse uploaded text files (PDF/DOCX via server-side library)
- Populate raw notes with extracted text

### 📋 Phase 6: UX Polish (Planned)
- Helper text and placeholders
- "Resume last intake" prompt
- Progress indicators for required fields
- Accessibility audit

---

## Technical Notes

### Domain Mapper Changes
**File**: `src/app/(authenticated)/toolkit/fca-pipeline/DomainMapper.tsx`

**Key Updates**:
```typescript
interface Props {
  data: FCASessionData;
  updateData: (d: FCASessionData) => void;
  next: () => void;
  back: () => void;
  initialNotes?: string;    // NEW: Pre-fill notes
  autoAnalyze?: boolean;     // NEW: Auto-trigger mapping
}
```

**Auto-analyze Logic**:
```typescript
useEffect(() => {
  if (!autoAnalyze) return;
  if (isAnalyzing) return;
  if (!rawNotes.trim()) return;
  if (Object.keys(data.observations).length > 0) return; // Skip if already mapped
  void handleAnalyze();
}, [autoAnalyze]);
```

---

## Future Enhancements

1. **Voice Dictation**: Browser Speech Recognition API (optional)
2. **Mobile Camera**: Capture documents via mobile camera (future)
3. **OCR for Handwritten Notes**: Parse handwritten attachments (advanced)
4. **Consent Capture**: Digital signature or checkbox (compliance)
5. **Multi-language Support**: Interpreter needs field (Phase 4)
6. **Risk/Safety Flags**: Quick checkboxes for safety concerns (Phase 4)

---

## Questions & Decisions

### Decisions Made (2026-01-25)
✅ NDIS number: **Strict 9-digit pattern** (no "Unknown" checkbox)  
✅ Session types/location: **Fixed list + custom entries**  
✅ Attachments: **Store in Supabase Storage** (per-user folders)  
✅ Auto-mapping: **Yes, auto-run when notes present**  
✅ Consent: **Leave out for now** (future)  

### Open Questions
- Maximum file upload size per attachment?
- Parse PDF/DOCX server-side or client-side?
- Autosave frequency (debounce interval)?
- Should we version intake drafts or overwrite?

---

## References

- [NDIS Practice Standards](https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-obligations-and-requirements/ndis-practice-standards)
- [NDIS Quality and Safeguards Commission](https://www.ndiscommission.gov.au/)
- [Occupational Therapy Australia - Clinical Documentation Guidelines](https://www.otaus.com.au/)

---

**Document Maintained By**: Development Team  
**Last Reviewed**: 2026-01-25
