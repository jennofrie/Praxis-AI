# NDIS OT Workflow Acceleration Brainstorm

## Goals
- Reduce report writing time without losing clinical rigor
- Improve evidence traceability and NDIS-aligned language
- Provide planners with actionable, participant-centric insights

## Research notes
- NDIS Practice Standards are structured as core, supplementary, and verification modules
- Each module includes outcomes and quality indicators used for audit compliance
- Reports should be auditable, participant-centred, and demonstrate safe provision of supports

## Occupational Therapist (NDIS) workflow needs
- Fast capture of clinical evidence during/after sessions
- Consistent mapping to NDIS domains and functional capacity language
- Easy generation of FCA, progress reports, AT justification
- Audit-ready reasoning and participant goal alignment
- Time-saving review/checklist to avoid missing evidence
- Safe AI outputs with editable and traceable sources

## OT-focused feature ideas

### 1. NDIS Evidence Matrix Builder
**Problem**: OTs spend hours manually organizing session notes to align with NDIS domains and quality indicators.

**Solution**: 
- Auto-maps clinical observations to NDIS domains (self-care, mobility, social interaction, communication, learning, etc.)
- Cross-references against Practice Standards quality indicators
- Highlights gaps in evidence collection
- Produces a "ready-to-submit" completeness score with specific recommendations

**Workflow**:
1. Upload session notes or dictate observations
2. System extracts functional evidence and maps to domains
3. Visual dashboard shows coverage per domain
4. Recommendations for missing evidence types
5. Export to FCA or progress report format

### 2. Session-to-FCA Pipeline
**Problem**: Converting raw session notes into structured Functional Capacity Assessment reports is repetitive and time-consuming.

**Solution**:
- Structured intake that prompts for domain-specific observations
- Auto-generates clinical reasoning narratives with NDIS-aligned language
- Links observations to functional impact and goal recommendations
- Flags weak AT or support hour justifications before submission

**Workflow**:
1. Clinician inputs/uploads session notes
2. System structures content by FCA sections
3. Generates clinical reasoning paragraphs with citations
4. Highlights areas needing more evidence
5. OT reviews, edits, and approves

### 3. Goal Progress Scoring Engine
**Problem**: Tracking participant progress across multiple sessions and aligning with plan goals is manual and inconsistent.

**Solution**:
- Links session outcomes to participant goals automatically
- Tracks progress trends over time
- Suggests goal updates based on evidence patterns
- Produces progress narratives aligned with NDIS language

**Workflow**:
1. Import participant goals from existing plan
2. Tag session activities to specific goals
3. System calculates progress metrics
4. Generates progress summary with recommendations
5. Flags goals for review or modification

### 4. AT Justification Assistant
**Problem**: Assistive Technology recommendations require extensive evidence, baseline comparisons, and alternative analysis.

**Solution**:
- Captures baseline functional capacity
- Documents trial period outcomes
- Compares AT options with cost-benefit analysis
- Drafts justification narrative with evidence citations
- Suggests alternatives if evidence is insufficient

**Workflow**:
1. Input baseline assessment data
2. Record AT trial observations and outcomes
3. System generates comparison matrix
4. Auto-drafts justification with clinical reasoning
5. OT reviews and refines before submission

### 5. Consent + Audit Trail Module
**Problem**: NDIS compliance requires clear consent processes and version control for all clinical documentation.

**Solution**:
- Tracks participant consent for AI processing and data use
- Records all edits with timestamps and user attribution
- Maintains version history for audit purposes
- Generates compliance reports on demand

**Features**:
- Participant consent forms with plain language
- Automated version tracking
- Audit log export
- Compliance dashboard

### 6. Report Quality Checker
**Problem**: Reports often get rejected due to missing evidence, unclear justifications, or non-NDIS language.

**Solution**:
- Real-time quality checks against NDIS requirements
- Language refinement suggestions
- Evidence gap detection
- Risk scoring for submission readiness

**Checks**:
- All required sections completed
- Evidence supports claims
- NDIS terminology used correctly
- Clinical reasoning is clear and traceable
- Goals align with plan objectives

## Senior NDIS Planner Workflow (Review Lens)

### Problem
Planners need to review multiple reports quickly while ensuring quality, consistency, and NDIS alignment. Current manual review is slow and inconsistent.

### Solution: AI-Powered Planner Review Tool

**Core Features**:
1. **Batch Report Analysis**
   - Upload multiple reports for comparative review
   - Automated quality scoring across all submissions
   - Identify patterns in missing evidence or weak justifications

2. **NDIS Alignment Check**
   - Compare report language against Practice Standards
   - Flag non-compliant terminology or structure
   - Suggest NDIS-aligned alternatives

3. **Evidence Strength Scoring**
   - Analyze clinical reasoning depth
   - Check evidence citations and traceability
   - Flag unsupported claims or weak justifications

4. **Consistency Analysis**
   - Compare current report against participant history
   - Identify contradictions or unexplained changes
   - Highlight missing follow-up from previous recommendations

5. **Submission Readiness Dashboard**
   - Overall quality score per report
   - Section-by-section gap analysis
   - Prioritized improvement recommendations
   - Estimated approval likelihood

**Workflow**:
1. Planner uploads report or report set
2. System runs automated checks against:
   - Core module outcomes
   - Quality indicators
   - Evidence requirements
   - NDIS language standards
3. Dashboard displays:
   - Overall readiness score
   - Section-level feedback
   - Missing evidence list
   - Language improvement suggestions
4. Planner reviews AI recommendations
5. Provides feedback to OT with specific improvement areas
6. Tracks revision history and re-submission scores

**Key Metrics**:
- First-pass approval rate
- Average time to approval
- Common rejection reasons
- Evidence quality trends

## Next Steps for Implementation

### Phase 1: Foundation (Months 1-2)
- Build NDIS domain taxonomy and quality indicator mapping
- Create prompt templates for each report type
- Develop basic evidence extraction from unstructured notes

### Phase 2: Core Workflows (Months 3-4)
- Implement Session-to-FCA pipeline
- Build Evidence Matrix Builder
- Add consent and audit trail module

### Phase 3: Advanced Features (Months 5-6)
- Deploy Goal Progress Scoring Engine
- Launch AT Justification Assistant
- Release Planner Review Tool

### Phase 4: Integration & Scale (Months 7+)
- Integrate with practice management systems
- Build analytics dashboard
- Add outcome tracking and quality improvement loops

## Open Questions for User Research

1. **OT Preferences**
   - What report types consume the most time?
   - Which evidence domains are hardest to document?
   - What's the typical revision cycle length?

2. **Planner Needs**
   - What are the most common rejection reasons?
   - How much time is spent on report review?
   - What evidence gaps appear most frequently?

3. **Technical Integration**
   - Which practice management systems are in use?
   - What file formats are standard?
   - Are there existing templates that should be preserved?

4. **Compliance & Privacy**
   - What consent processes are currently in place?
   - How is data currently stored and secured?
   - What audit requirements must be met?

## Success Metrics

- **Efficiency**: 50%+ reduction in report drafting time
- **Quality**: 30%+ increase in first-pass approval rate
- **Compliance**: 100% audit trail coverage
- **Satisfaction**: 80%+ OT and planner satisfaction scores
- **Accuracy**: 95%+ clinical accuracy validation rate
