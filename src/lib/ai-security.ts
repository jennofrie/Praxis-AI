/**
 * AI Security — prompt injection sanitizer
 * Strips HTML, blocks known injection patterns, enforces max length.
 */

const MAX_INPUT_LENGTH = 2000;

const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|above)\s+instructions?/i,
  /system\s*:/i,
  /\[INST\]/i,
  /<\|system\|>/i,
  /act\s+as\s+(a\s+)?(?:different|new|another|an?\s+AI|an?\s+evil|an?\s+unrestricted)/i,
  /developer\s+mode/i,
  /DAN\s+mode/i,
  /jailbreak/i,
  /prompt\s+injection/i,
  /override\s+(your\s+)?(instructions?|guidelines?|rules?)/i,
  /forget\s+(your\s+)?(instructions?|guidelines?|rules?|training)/i,
  /you\s+are\s+now\s+(?!an?\s+NDIS)/i,
  /<script[\s\S]*?>/i,
];

export interface SanitizeResult {
  sanitized: string;
  isValid: boolean;
  violations: string[];
}

export function sanitizeAIInput(input: string): SanitizeResult {
  const violations: string[] = [];

  // Strip HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Enforce max length
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    violations.push(`Input truncated to ${MAX_INPUT_LENGTH} characters`);
  }

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      violations.push(`Blocked pattern: ${pattern.source.substring(0, 40)}`);
    }
  }

  const isValid = violations.filter(v => !v.startsWith('Input truncated')).length === 0;

  return { sanitized, isValid, violations };
}
