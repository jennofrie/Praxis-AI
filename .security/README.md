# Supabase Best Practices for NDIS B2B SaaS - Complete Guide

This package contains everything you need to build and maintain a secure, scalable Supabase database for your NDIS B2B SaaS platform (Praxis-AI).

## 📦 What's Included

### 1. **claude.md** - Master Reference Guide
**Purpose:** Complete Supabase best practices documentation for AI assistants and developers  
**Use when:** Building features, writing queries, setting up new tables, debugging issues

**Contains:**
- ✅ Complete database schema for all core tables (participants, sessions, goals, reports, etc.)
- ✅ Row-Level Security (RLS) policies for multi-tenancy
- ✅ Performance optimization strategies (indexes, materialized views)
- ✅ Security best practices (encryption, rate limiting, validation)
- ✅ Audit trail implementation
- ✅ Edge Functions examples
- ✅ Client-side query patterns
- ✅ Monitoring & alerting queries
- ✅ Backup & disaster recovery strategies

### 2. **RLS_TESTING_GUIDE.md** - Test Your Security
**Purpose:** Comprehensive guide for testing Row-Level Security policies  
**Use when:** After creating new tables, before deploying to production, debugging access issues

**Contains:**
- ✅ Manual test procedures
- ✅ Automated testing scripts (TypeScript/Jest)
- ✅ Common RLS mistakes and fixes
- ✅ Performance testing for RLS
- ✅ Debugging techniques

### 3. **SECURITY_AUDIT_CHECKLIST.md** - Regular Health Checks
**Purpose:** SQL queries to audit database security and performance  
**Use when:** Weekly/monthly security reviews, before major releases, investigating issues

**Contains:**
- ✅ RLS security verification
- ✅ Index optimization checks
- ✅ Query performance analysis
- ✅ Connection monitoring
- ✅ Data integrity validation
- ✅ Storage & bloat checks
- ✅ Compliance verification
- ✅ Automated health check script

---

## 🚀 Quick Start

### Step 1: Set Up Your Database Schema

```bash
# Copy SQL from claude.md sections:
# 1. Organizations table
# 2. Profiles table
# 3. Participants table
# 4. Sessions table
# 5. Goals table
# 6. Evidence Matrix table
# 7. Reports table
# 8. Audit Logs table

# Run in Supabase SQL Editor or via migration files
```

### Step 2: Enable RLS on All Tables

```sql
-- From claude.md, run for each table:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Then create policies (examples in claude.md)
CREATE POLICY "View organization data"
  ON table_name FOR SELECT
  USING (organization_id = auth.user_organization_id());
```

### Step 3: Test Your RLS Policies

```bash
# Follow RLS_TESTING_GUIDE.md
# 1. Create test users
# 2. Run manual tests
# 3. Set up automated tests
# 4. Verify cross-organization isolation
```

### Step 4: Run Security Audit

```bash
# Copy queries from SECURITY_AUDIT_CHECKLIST.md
# Run in Supabase SQL Editor
# Fix any issues found
```

---

## 📋 Daily/Weekly Checklist

### Daily Tasks (5 minutes)
- [ ] Run "Active Connections" check
- [ ] Check for long-running queries
- [ ] Verify audit logging is working
- [ ] Check for expiring NDIS plans

### Weekly Tasks (30 minutes)
- [ ] Run full security audit
- [ ] Review slow queries
- [ ] Check index usage
- [ ] Verify backup status
- [ ] Review error logs

### Monthly Tasks (2 hours)
- [ ] Full security audit with all checks
- [ ] Review and optimize indexes
- [ ] Test backup restoration
- [ ] Update documentation
- [ ] Review and archive old audit logs

---

## 🔒 Security Checklist Before Production

Use this before deploying:

```markdown
## Critical Security Checks

- [ ] All tables have RLS enabled
- [ ] All foreign keys have indexes
- [ ] No policies use USING (true) without filters
- [ ] Service role key is NOT in client code
- [ ] All sensitive data is encrypted
- [ ] Audit logging is enabled on critical tables
- [ ] Rate limiting is implemented
- [ ] Storage buckets have RLS policies
- [ ] JWT custom claims are configured
- [ ] Backup/restore has been tested
- [ ] Connection pooling is configured
- [ ] pg_cron jobs are scheduled
- [ ] Monitoring alerts are set up
- [ ] Team has reviewed security docs
```

---

## 📚 Common Use Cases

### Creating a New Table

1. **Define Schema** (reference claude.md for patterns)
```sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  -- other fields...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Add Indexes**
```sql
CREATE INDEX idx_new_table_org ON new_table(organization_id);
-- Add other relevant indexes
```

3. **Enable RLS**
```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

4. **Create Policies**
```sql
-- Copy pattern from claude.md
CREATE POLICY "View organization data"
  ON new_table FOR SELECT
  USING (organization_id = auth.user_organization_id());
```

5. **Add Triggers**
```sql
-- Audit trail
CREATE TRIGGER audit_new_table
  AFTER INSERT OR UPDATE OR DELETE ON new_table
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Updated_at
CREATE TRIGGER update_new_table_timestamp
  BEFORE UPDATE ON new_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

6. **Test** (follow RLS_TESTING_GUIDE.md)

---

### Debugging "Permission Denied" Error

1. **Check if RLS is enabled**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'your_table';
```

2. **View policies**
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

3. **Test as user**
```sql
SET request.jwt.claims = '{"sub": "user-id", "app_metadata": {"organization_id": "org-id"}}';
SELECT * FROM your_table;
```

4. **Check organization_id**
```sql
-- Verify user's organization ID
SELECT auth.user_organization_id();

-- Check if data belongs to user's org
SELECT organization_id FROM your_table WHERE id = 'record-id';
```

---

### Optimizing Slow Queries

1. **Identify slow queries** (SECURITY_AUDIT_CHECKLIST.md)
```sql
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

2. **Analyze query plan**
```sql
EXPLAIN ANALYZE your_slow_query;
```

3. **Add missing indexes**
```sql
-- If you see "Seq Scan" on large table:
CREATE INDEX CONCURRENTLY idx_name ON table_name(column);
```

4. **Rewrite query if needed**
```typescript
// Example: Use specific columns instead of *
const { data } = await supabase
  .from('participants')
  .select('id, first_name, last_name, status') // Not SELECT *
  .eq('organization_id', orgId);
```

---

## 🛠️ Tools & Extensions

### Required PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query monitoring
CREATE EXTENSION IF NOT EXISTS "pg_cron";        -- Scheduled jobs
```

### Recommended VS Code Extensions

- **Supabase** - Official extension for local development
- **PostgreSQL** - SQL syntax highlighting
- **Thunder Client** - API testing
- **Database Client** - Visual database management

### Useful CLI Commands

```bash
# Generate TypeScript types
npx supabase gen types typescript --project-id PROJECT_ID > types/supabase.ts

# Run migrations
npx supabase migration up

# Create new migration
npx supabase migration new migration_name

# Reset local database
npx supabase db reset

# Link to project
npx supabase link --project-ref PROJECT_ID

# View logs
npx supabase functions logs function_name
```

---

## 📊 Monitoring Dashboard Queries

Save these in Supabase Dashboard → SQL Editor for quick access:

### Database Health
```sql
-- Connection usage
SELECT count(*) as connections,
       max_conn as max,
       round(100.0 * count(*) / max_conn, 2) || '%' as usage
FROM pg_stat_activity,
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') mc;
```

### Top Tables by Size
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Recent Audit Activity
```sql
SELECT 
  action,
  resource_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action, resource_type
ORDER BY count DESC;
```

---

## 🆘 Emergency Procedures

### Connection Pool Exhausted

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '30 minutes';
```

### Suspected Data Breach

1. Immediately rotate all API keys
2. Review audit logs for suspicious activity
3. Check RLS policies are working
4. Verify no service_role key in client code
5. Contact Supabase support

### Performance Degradation

1. Check slow queries (SECURITY_AUDIT_CHECKLIST.md)
2. Verify indexes exist on foreign keys
3. Check connection pool usage
4. Review table bloat
5. Consider scaling database tier

### Data Corruption

1. Stop all writes immediately
2. Restore from most recent backup
3. Verify data integrity
4. Review audit logs for cause
5. Implement additional checks

---

## 📖 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Performance Tips**: https://supabase.com/docs/guides/database/performance

---

## 🎯 Success Metrics

Track these KPIs to ensure your database is healthy:

| Metric | Target | Check Frequency |
|--------|--------|-----------------|
| Average query time | < 100ms | Daily |
| Connection pool usage | < 50% | Daily |
| RLS policy coverage | 100% | Weekly |
| Index hit ratio | > 99% | Weekly |
| Failed queries | < 0.1% | Daily |
| Backup age | < 24 hours | Daily |
| Disk usage | < 80% | Weekly |
| Security audit score | 100% | Weekly |

---

## 🤝 Contributing

Keep these documents updated as your platform evolves:

1. Add new tables to claude.md with proper RLS policies
2. Update security checklist with new checks
3. Add new test cases to RLS testing guide
4. Document any new patterns or best practices

---

## 📝 Version History

- **v1.0** (Current) - Initial release with complete NDIS platform schema
- Focus: Multi-tenancy, security, compliance, performance

---

## ⚠️ Critical Reminders

1. **NEVER** expose service_role key in client-side code
2. **ALWAYS** enable RLS on new tables
3. **ALWAYS** add indexes on foreign keys
4. **ALWAYS** filter by organization_id in policies
5. **NEVER** use USING (true) without proper filters
6. **ALWAYS** test RLS before deploying
7. **ALWAYS** encrypt sensitive data
8. **ALWAYS** maintain audit logs
9. **ALWAYS** have tested backups
10. **ALWAYS** monitor query performance

---

**Need Help?**

1. Check claude.md for patterns and examples
2. Run security audit checklist
3. Review RLS testing guide
4. Check Supabase documentation
5. Ask in Supabase Discord community

**Remember:** Security and performance are ongoing efforts, not one-time tasks. Regular audits and monitoring are essential for maintaining a production-grade database.

Good luck with Praxis-AI! 🚀
