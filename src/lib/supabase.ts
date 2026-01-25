import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for Client Components (handles cookies)
let browserClient: ReturnType<typeof createSSRBrowserClient> | null = null;

export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createSSRBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

// Legacy client (LocalStorage) - kept for backward compatibility if needed, but discouraged
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service Role Client (for API routes/Admin tasks)
// RENAMED from createServerClient to avoid confusion with SSR client
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to .env.local and restart your dev server with: npm run dev'
    );
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// Type definitions for database tables
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  role: 'clinician' | 'planner' | 'admin';
  role_title?: string | null;
  organization: string | null;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    aiModel: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  user_id: string;
  ndis_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  primary_diagnosis: string | null;
  secondary_diagnoses: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: Record<string, unknown> | null;
  support_coordinator: string | null;
  plan_manager: string | null;
  notes: string | null;
  ai_consent: boolean;
  ai_consent_date: string | null;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  participant_id: string;
  ndis_plan_id: string | null;
  title: string;
  description: string | null;
  domain: string;
  target_date: string | null;
  status: 'not_started' | 'in_progress' | 'achieved' | 'on_hold' | 'discontinued';
  progress_percentage: number;
  baseline_measure: string | null;
  target_measure: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  participant_id: string;
  clinician_id: string | null;
  session_date: string;
  session_type: 'assessment' | 'intervention' | 'review' | 'home-visit' | 'telehealth' | 'report-writing';
  duration_minutes: number | null;
  raw_notes: string | null;
  structured_observations: Record<string, unknown>;
  goals_addressed: string[];
  location: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  billable: boolean;
  ai_processed: boolean;
  ai_processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  participant_id: string;
  author_id: string | null;
  report_type: 'fca' | 'at-justification' | 'progress-report' | 'discharge-summary' | 'review';
  title: string;
  content: string | null;
  domain_evidence: Record<string, unknown>;
  quality_score: number | null;
  quality_issues: unknown[];
  status: 'draft' | 'review' | 'final' | 'submitted';
  ai_generated: boolean;
  ai_model_used: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  participant_id: string | null;
  draft_type: 'fca-pipeline' | 'evidence-matrix' | 'at-justification' | 'goal-progress' | 'report';
  content: Record<string, unknown>;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'ai_request';
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Helper functions
export async function logAuditEvent(
  userId: string | null,
  action: AuditLog['action'],
  resourceType: string,
  resourceId?: string,
  resourceName?: string,
  details?: Record<string, unknown>
) {
  const client = createServiceRoleClient();
  
  await client.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    details,
  });
}

export async function trackAIUsage(
  userId: string | null,
  participantId: string | null,
  feature: string,
  modelUsed: string,
  metrics: {
    inputTokens?: number;
    outputTokens?: number;
    responseTimeMs?: number;
    success: boolean;
    errorMessage?: string;
  }
) {
  const client = createServiceRoleClient();
  
  await client.from('ai_usage').insert({
    user_id: userId,
    participant_id: participantId,
    feature,
    model_used: modelUsed,
    input_tokens: metrics.inputTokens,
    output_tokens: metrics.outputTokens,
    response_time_ms: metrics.responseTimeMs,
    success: metrics.success,
    error_message: metrics.errorMessage,
  });
}

export async function saveDraft(
  userId: string,
  draftType: Draft['draft_type'],
  content: Record<string, unknown>,
  participantId?: string
) {
  const client = createServiceRoleClient();
  
  // Upsert draft (replace existing draft of same type for same user/participant)
  const { data, error } = await client
    .from('drafts')
    .upsert({
      user_id: userId,
      participant_id: participantId,
      draft_type: draftType,
      content,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }, {
      onConflict: 'user_id,draft_type',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving draft:', error);
    return null;
  }
  
  return data;
}

export async function loadDraft(
  userId: string,
  draftType: Draft['draft_type']
): Promise<Draft | null> {
  const client = createServiceRoleClient();
  
  const { data, error } = await client
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .eq('draft_type', draftType)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as Draft;
}
