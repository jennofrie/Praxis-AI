/**
 * Client-safe fire-and-forget audit logger.
 * Calls /api/audit — no service role key needed client-side.
 */

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'ai_request';

export function logAudit(
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  resourceName?: string
): void {
  fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, resourceType, resourceId, resourceName }),
  }).catch(() => {
    // Fire and forget — silently ignore errors
  });
}
