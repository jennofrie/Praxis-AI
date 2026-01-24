# Praxis AI - Supabase Edge Functions

This directory contains all AI-powered Edge Functions for the Praxis AI platform.

## Functions Overview

| Function | Description | Endpoint |
|----------|-------------|----------|
| `fca-pipeline` | Domain mapping & FCA narrative generation | `/functions/v1/fca-pipeline` |
| `evidence-matrix` | Clinical evidence extraction & mapping | `/functions/v1/evidence-matrix` |
| `at-justification` | AT cost-benefit analysis & justification | `/functions/v1/at-justification` |
| `quality-checker` | NDIS compliance auditing | `/functions/v1/quality-checker` |
| `goal-progress` | Goal progress analysis | `/functions/v1/goal-progress` |
| `ai-chat` | General AI assistant | `/functions/v1/ai-chat` |

---

## Prerequisites

1. **Supabase CLI** - Install globally:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref nwwesogezwemoevhfvgi
   ```

---

## Setting Up Secrets

**IMPORTANT:** Before deploying, you must set up your API keys as secrets:

```bash
# Set Gemini API Key (Required)
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Optional: Ollama/Local Model Configuration
supabase secrets set OLLAMA_BASE_URL=https://your-ollama-endpoint
supabase secrets set CF_ACCESS_CLIENT_ID=your-cloudflare-id
supabase secrets set CF_ACCESS_CLIENT_SECRET=your-cloudflare-secret

# Verify secrets are set
supabase secrets list
```

---

## Deployment

### Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy with specific options
supabase functions deploy --no-verify-jwt  # If testing without auth
```

### Deploy Individual Functions

```bash
# Deploy specific function
supabase functions deploy fca-pipeline
supabase functions deploy evidence-matrix
supabase functions deploy at-justification
supabase functions deploy quality-checker
supabase functions deploy goal-progress
supabase functions deploy ai-chat
```

---

## Local Development

### Start Local Supabase

```bash
supabase start
```

### Serve Functions Locally

```bash
# Serve all functions
supabase functions serve

# Serve specific function with env file
supabase functions serve fca-pipeline --env-file .env.local
```

### Test Functions Locally

```bash
# Test FCA Pipeline - Domain Mapping
curl -i --location --request POST 'http://localhost:54321/functions/v1/fca-pipeline' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action":"map-domains","notes":"Patient demonstrated difficulty with fine motor tasks during assessment..."}'

# Test Evidence Matrix
curl -i --location --request POST 'http://localhost:54321/functions/v1/evidence-matrix' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"notes":"Session notes content here..."}'
```

---

## API Reference

### FCA Pipeline

**Endpoint:** `POST /functions/v1/fca-pipeline`

**Actions:**

1. **Map Domains**
```json
{
  "action": "map-domains",
  "notes": "Clinical notes text..."
}
```

2. **Generate Narrative**
```json
{
  "action": "generate-narrative",
  "participantName": "John Doe",
  "diagnosis": "Cerebral Palsy",
  "domains": [
    {
      "domain": "Mobility",
      "observations": ["Uses walker for transfers", "Fatigue after 10 minutes"],
      "confidence": "high"
    }
  ],
  "goals": ["Improve independent mobility"]
}
```

---

### Evidence Matrix

**Endpoint:** `POST /functions/v1/evidence-matrix`

```json
{
  "notes": "Clinical session notes...",
  "existingEvidence": [
    {
      "domain": "Self-Care",
      "observations": ["Previous observation 1"]
    }
  ]
}
```

---

### AT Justification

**Endpoint:** `POST /functions/v1/at-justification`

```json
{
  "participantName": "Jane Smith",
  "diagnosis": "Multiple Sclerosis",
  "functionalNeed": "Difficulty with meal preparation due to upper limb tremor",
  "currentMethod": "Relies on family member to prepare all meals",
  "selectedItem": {
    "name": "Weighted Cutlery Set",
    "cost": 150,
    "effectiveness": 85,
    "participantPreference": 90,
    "maintenanceCost": 20,
    "fundingSource": "ndis"
  },
  "alternatives": [
    {
      "name": "Standard Adaptive Cutlery",
      "cost": 50,
      "effectiveness": 60,
      "participantPreference": 70,
      "maintenanceCost": 10,
      "fundingSource": "ndis"
    }
  ],
  "goals": ["Independent meal preparation"]
}
```

---

### Quality Checker

**Endpoint:** `POST /functions/v1/quality-checker`

```json
{
  "content": "Report content to audit...",
  "reportType": "fca"
}
```

---

### Goal Progress

**Endpoint:** `POST /functions/v1/goal-progress`

```json
{
  "participantName": "John Doe",
  "goal": {
    "description": "Independently prepare simple meals",
    "targetDate": "2024-06-01",
    "baseline": "Unable to use stove safely",
    "target": "Prepare 3 simple meals independently"
  },
  "sessions": [
    {
      "date": "2024-01-15",
      "notes": "Practiced boiling water with supervision...",
      "indicators": ["improved", "progressing"]
    }
  ]
}
```

---

### AI Chat

**Endpoint:** `POST /functions/v1/ai-chat`

```json
{
  "message": "Help me draft session notes for a mobility assessment",
  "mode": "draft-notes",
  "context": {
    "participantName": "John Doe",
    "currentPage": "toolkit"
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message..."
    }
  ]
}
```

**Modes:**
- `general` - General assistance
- `draft-notes` - Help draft clinical notes
- `explain` - Explain NDIS concepts
- `template` - Provide document templates

---

## Viewing Logs

### Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → Select function → **Logs**

### CLI Logs

```bash
# View logs for specific function
supabase functions logs fca-pipeline

# Follow logs in real-time
supabase functions logs fca-pipeline --follow
```

---

## Debugging Tips

1. **Check logs immediately after error:**
   ```bash
   supabase functions logs <function-name> --limit 50
   ```

2. **Verify secrets are set:**
   ```bash
   supabase secrets list
   ```

3. **Test locally first:**
   ```bash
   supabase functions serve <function-name> --env-file .env.local --debug
   ```

4. **Check function status:**
   ```bash
   supabase functions list
   ```

---

## Architecture

```
supabase/functions/
├── _shared/
│   ├── cors.ts        # CORS headers
│   └── gemini.ts      # Shared Gemini client & prompts
├── fca-pipeline/
│   └── index.ts       # FCA domain mapping & narrative
├── evidence-matrix/
│   └── index.ts       # Evidence extraction
├── at-justification/
│   └── index.ts       # AT cost analysis
├── quality-checker/
│   └── index.ts       # NDIS compliance audit
├── goal-progress/
│   └── index.ts       # Goal progress analysis
├── ai-chat/
│   └── index.ts       # General AI assistant
└── README.md          # This file
```

---

## Security

- All functions require JWT authentication by default
- Secrets are encrypted and stored server-side
- CORS headers configured for your domain
- Rate limiting handled by Supabase

---

## Cost Considerations

- Edge Functions: Billed per invocation
- Gemini API: Billed per token
- Consider caching responses for repeated queries
- Use Flash model for simpler tasks to reduce costs

---

## Support

- **Technical Issues:** Check [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- **Project Issues:** [GitHub Issues](https://github.com/jennofrie/Praxis-AI/issues)
