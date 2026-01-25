# Supabase Security Audit Checklist

Run these queries regularly to ensure your database is secure and optimized.

## 1. RLS Security Audit

### Check for tables without RLS enabled

```sql
-- CRITICAL: All tables should have RLS enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED - FIX IMMEDIATELY'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- Expected: All tables show "✅ ENABLED"
-- Action: If any show "DISABLED", run:
-- ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;
```

### Check for overly permissive policies

```sql
-- WARNING: Policies that allow access to all rows
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual = 'true'::text::pg_node_tree THEN '⚠️  DANGEROUS - Allows all access'
    ELSE '✅ OK - Has filter'
  END as policy_safety,
  cmd as command_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN qual = 'true'::text::pg_node_tree THEN 0 ELSE 1 END,
  tablename;

-- Expected: No policies with "DANGEROUS"
-- Action: Fix policies that use USING (true) without proper filters
```

### Verify organization_id filtering

```sql
-- Check that critical tables filter by organization_id
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) LIKE '%organization_id%' 
      THEN '✅ Has org filter'
    ELSE '❌ Missing org filter'
  END as org_filter_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('participants', 'sessions', 'reports', 'goals', 'evidence_matrix')
ORDER BY tablename, policyname;

-- Expected: All policies show "Has org filter"
-- Action: Add organization_id checks to policies missing them
```

---

## 2. Index Optimization

### Check for missing foreign key indexes

```sql
-- CRITICAL: All foreign keys should have indexes
SELECT 
  tc.table_name,
  kcu.column_name,
  CASE 
    WHEN i.indexname IS NOT NULL THEN '✅ Indexed'
    ELSE '❌ MISSING INDEX - Add immediately'
  END as index_status,
  'CREATE INDEX CONCURRENTLY idx_' || tc.table_name || '_' || kcu.column_name || 
  ' ON ' || tc.table_name || '(' || kcu.column_name || ');' as suggested_fix
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes i 
  ON i.tablename = tc.table_name 
  AND i.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY 
  CASE WHEN i.indexname IS NULL THEN 0 ELSE 1 END,
  tc.table_name;

-- Expected: All foreign keys show "✅ Indexed"
-- Action: Run suggested_fix for any missing indexes
```

### Find unused indexes (candidates for removal)

```sql
-- Indexes that are never used (waste space and slow writes)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  'DROP INDEX CONCURRENTLY ' || indexname || ';' as suggested_action
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
  AND indexrelid::regclass::text NOT LIKE '%_id_key%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Expected: Minimal unused indexes
-- Action: Review and drop indexes that are truly unused
```

### Check index bloat

```sql
-- Indexes that have significant bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️  Unused'
    WHEN pg_relation_size(indexrelid) > 100 * 1024 * 1024 THEN '⚠️  Large'
    ELSE '✅ OK'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Action: REINDEX large or bloated indexes
-- REINDEX INDEX CONCURRENTLY indexname;
```

---

## 3. Query Performance

### Find slow queries

```sql
-- Requires pg_stat_statements extension
SELECT 
  SUBSTRING(query, 1, 100) as query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) as total_time_ms,
  ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
  ROUND(max_exec_time::numeric, 2) as max_time_ms,
  CASE 
    WHEN mean_exec_time > 1000 THEN '❌ VERY SLOW - Optimize'
    WHEN mean_exec_time > 100 THEN '⚠️  SLOW - Review'
    ELSE '✅ OK'
  END as performance
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND mean_exec_time > 50
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Expected: No queries with "VERY SLOW"
-- Action: Optimize slow queries with indexes or query rewrites
```

### Check for sequential scans on large tables

```sql
-- Sequential scans are slow on large tables
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  n_live_tup as row_count,
  CASE 
    WHEN n_live_tup > 10000 AND seq_scan > idx_scan THEN '❌ Too many seq scans'
    WHEN seq_scan > 0 THEN '⚠️  Has seq scans'
    ELSE '✅ Using indexes'
  END as scan_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Expected: Large tables use index scans, not sequential scans
-- Action: Add indexes to reduce sequential scans
```

---

## 4. Connection & Resource Management

### Check active connections

```sql
-- Monitor connection usage
SELECT 
  count(*) as current_connections,
  max_conn as max_connections,
  ROUND(100.0 * count(*) / max_conn, 2) as usage_percentage,
  CASE 
    WHEN count(*) > max_conn * 0.8 THEN '❌ CRITICAL - Near limit'
    WHEN count(*) > max_conn * 0.5 THEN '⚠️  WARNING - High usage'
    ELSE '✅ OK'
  END as connection_status
FROM pg_stat_activity,
  (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') mc;

-- Expected: Usage < 50%
-- Action: If high, implement connection pooling or scale database
```

### Find long-running queries

```sql
-- Queries running longer than 30 seconds
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  NOW() - query_start as duration,
  state,
  SUBSTRING(query, 1, 100) as query_preview,
  CASE 
    WHEN NOW() - query_start > INTERVAL '5 minutes' THEN '❌ CRITICAL - Kill'
    WHEN NOW() - query_start > INTERVAL '1 minute' THEN '⚠️  LONG - Monitor'
    ELSE '✅ OK'
  END as status
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- Action: Kill long-running queries if necessary
-- SELECT pg_terminate_backend(pid);
```

### Check for idle connections

```sql
-- Idle connections waste resources
SELECT 
  state,
  COUNT(*) as connection_count,
  CASE 
    WHEN state = 'idle' AND COUNT(*) > 10 THEN '⚠️  Too many idle'
    ELSE '✅ OK'
  END as status
FROM pg_stat_activity
GROUP BY state
ORDER BY connection_count DESC;

-- Expected: Minimal idle connections
-- Action: Implement proper connection closing in application
```

---

## 5. Data Integrity

### Check for orphaned records

```sql
-- Sessions without valid participants (shouldn't happen with FK constraints)
SELECT 
  'sessions' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ Orphaned records found'
    ELSE '✅ No orphans'
  END as status
FROM sessions s
WHERE NOT EXISTS (
  SELECT 1 FROM participants p WHERE p.id = s.participant_id
);

-- Reports without valid participants
SELECT 
  'reports' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ Orphaned records found'
    ELSE '✅ No orphans'
  END as status
FROM reports r
WHERE NOT EXISTS (
  SELECT 1 FROM participants p WHERE p.id = r.participant_id
);

-- Expected: 0 orphaned records
-- Action: Investigate and fix data integrity issues
```

### Verify constraint integrity

```sql
-- Check for violated constraints
SELECT 
  conrelid::regclass as table_name,
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END as constraint_description,
  '✅ Valid' as status
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype;

-- All constraints should be valid
```

---

## 6. Storage & Bloat

### Check table sizes

```sql
-- Monitor table growth
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                 pg_relation_size(schemaname||'.'||tablename)) as index_size,
  ROUND(100.0 * pg_total_relation_size(schemaname||'.'||tablename) / 
        NULLIF(pg_database_size(current_database()), 0), 2) as pct_of_db
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Monitor for unexpected growth
```

### Check for table bloat

```sql
-- Tables that need VACUUM
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_row_pct,
  CASE 
    WHEN n_dead_tup > 10000 AND n_dead_tup > n_live_tup * 0.2 THEN '❌ VACUUM NEEDED'
    WHEN n_dead_tup > 1000 THEN '⚠️  Consider VACUUM'
    ELSE '✅ OK'
  END as vacuum_status,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Action: VACUUM tables with high dead row percentage
-- VACUUM ANALYZE tablename;
```

---

## 7. Audit & Compliance

### Verify audit logging is working

```sql
-- Check recent audit log entries
SELECT 
  COUNT(*) as recent_audit_entries,
  MAX(created_at) as latest_entry,
  CASE 
    WHEN MAX(created_at) < NOW() - INTERVAL '1 hour' THEN '⚠️  No recent logs'
    ELSE '✅ Logging active'
  END as logging_status
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Expected: Recent entries exist
-- Action: Investigate if no recent audit logs
```

### Check consent form coverage

```sql
-- Participants without current consent
SELECT 
  COUNT(DISTINCT p.id) as participants_without_consent,
  CASE 
    WHEN COUNT(DISTINCT p.id) > 0 THEN '⚠️  Missing consents'
    ELSE '✅ All have consent'
  END as consent_status
FROM participants p
LEFT JOIN consent_forms c ON c.participant_id = p.id 
  AND c.consented = true 
  AND (c.expiry_date IS NULL OR c.expiry_date > CURRENT_DATE)
WHERE p.status = 'active'
  AND c.id IS NULL;

-- Expected: All active participants have valid consent
-- Action: Follow up on missing consents
```

### Check expiring NDIS plans

```sql
-- Plans expiring in next 30 days
SELECT 
  COUNT(*) as plans_expiring_soon,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️  ' || COUNT(*) || ' plans expiring soon'
    ELSE '✅ No immediate expirations'
  END as expiration_status
FROM ndis_plans
WHERE status = 'active'
  AND plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- Action: Review and prepare plan renewals
```

---

## 8. Backup & Recovery

### Verify backup status

```sql
-- Check last successful backup (via Supabase Dashboard or CLI)
-- This is a reminder to check in the Supabase dashboard

SELECT 
  'MANUAL CHECK REQUIRED' as action,
  'Verify backups in Supabase Dashboard → Database → Backups' as location,
  'Ensure PITR is enabled and backups are recent' as instruction;
```

### Test data export

```sql
-- Verify export function works
SELECT COUNT(*) as exportable_organizations
FROM organizations
WHERE is_active = true;

-- Try exporting a test organization
-- SELECT export_organization_data('test-org-id');
```

---

## 9. Security Best Practices

### Check for exposed sensitive data

```sql
-- Verify encrypted fields are actually encrypted
SELECT 
  tablename,
  attname as column_name,
  CASE 
    WHEN attname LIKE '%password%' OR attname LIKE '%secret%' OR attname LIKE '%key%' 
      THEN '⚠️  Should be encrypted'
    ELSE '✅ OK'
  END as encryption_check
FROM pg_attribute
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
  AND pg_class.relkind = 'r'
  AND attname NOT LIKE '%_id'
  AND attname IN (
    SELECT attname FROM pg_attribute
    WHERE attname LIKE '%password%' 
      OR attname LIKE '%secret%'
      OR attname LIKE '%api_key%'
      OR attname LIKE '%token%'
  );

-- Action: Encrypt any sensitive fields found
```

### Verify service role is not exposed

```sql
-- This is a reminder - check application code
SELECT 
  'MANUAL CHECK REQUIRED' as action,
  'Search codebase for SUPABASE_SERVICE_ROLE_KEY in client-side code' as location,
  'Service role key must NEVER be in browser/client code' as instruction;
```

---

## 10. Automated Health Check Script

```sql
-- Run this as a single health check
DO $$
DECLARE
  issues TEXT[] := '{}';
  issue_count INT := 0;
BEGIN
  -- Check 1: RLS enabled on all tables
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = false
  ) THEN
    issues := array_append(issues, '❌ Tables without RLS found');
    issue_count := issue_count + 1;
  END IF;

  -- Check 2: Missing foreign key indexes
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN pg_indexes i 
      ON i.tablename = tc.table_name 
      AND i.indexdef LIKE '%' || kcu.column_name || '%'
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND i.indexname IS NULL
  ) THEN
    issues := array_append(issues, '❌ Missing foreign key indexes');
    issue_count := issue_count + 1;
  END IF;

  -- Check 3: High connection usage
  IF (SELECT count(*) FROM pg_stat_activity) > 
     (SELECT setting::int * 0.8 FROM pg_settings WHERE name = 'max_connections') THEN
    issues := array_append(issues, '⚠️  High connection usage');
    issue_count := issue_count + 1;
  END IF;

  -- Check 4: Tables needing VACUUM
  IF EXISTS (
    SELECT 1 FROM pg_stat_user_tables
    WHERE n_dead_tup > 10000 
      AND n_dead_tup > n_live_tup * 0.2
  ) THEN
    issues := array_append(issues, '⚠️  Tables need VACUUM');
    issue_count := issue_count + 1;
  END IF;

  -- Output results
  IF issue_count = 0 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED - Database is healthy';
  ELSE
    RAISE NOTICE '❌ FOUND % ISSUES:', issue_count;
    FOR i IN 1..array_length(issues, 1) LOOP
      RAISE NOTICE '%', issues[i];
    END LOOP;
  END IF;
END $$;
```

---

## Recommended Frequency

| Check | Frequency |
|-------|-----------|
| RLS Security Audit | Weekly |
| Index Optimization | Monthly |
| Query Performance | Weekly |
| Connection Management | Daily |
| Data Integrity | Weekly |
| Storage & Bloat | Monthly |
| Audit & Compliance | Daily |
| Backup Verification | Weekly |
| Security Best Practices | Monthly |
| Automated Health Check | Daily |

---

## Emergency Response

If you find critical issues:

1. **Missing RLS**: Enable immediately with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. **Data breach**: Rotate all API keys, review audit logs
3. **Performance issues**: Add missing indexes, kill long queries
4. **Connection exhaustion**: Scale database tier, implement pooling
5. **Data corruption**: Restore from backup immediately

Keep this checklist handy and run it regularly!
