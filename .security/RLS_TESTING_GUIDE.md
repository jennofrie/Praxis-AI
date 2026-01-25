# RLS Policy Testing Guide

## How to Test Row-Level Security Policies

### Setup Test Users

```sql
-- Create test organization
INSERT INTO organizations (id, name, ndis_provider_number)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Org 1', 'TEST001'),
  ('22222222-2222-2222-2222-222222222222', 'Test Org 2', 'TEST002');

-- Create test users in auth.users (via Supabase Dashboard or API)
-- User 1: test1@org1.com (Org 1, Admin)
-- User 2: test2@org1.com (Org 1, Clinician)
-- User 3: test3@org2.com (Org 2, Admin)

-- Create profiles
INSERT INTO profiles (id, organization_id, email, full_name, role)
VALUES
  ('user-1-uuid', '11111111-1111-1111-1111-111111111111', 'test1@org1.com', 'Test Admin 1', 'admin'),
  ('user-2-uuid', '11111111-1111-1111-1111-111111111111', 'test2@org1.com', 'Test Clinician 1', 'clinician'),
  ('user-3-uuid', '22222222-2222-2222-2222-222222222222', 'test3@org2.com', 'Test Admin 2', 'admin');

-- Create test participants
INSERT INTO participants (organization_id, first_name, last_name, ndis_number)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John', 'Doe', '123456789'),
  ('22222222-2222-2222-2222-222222222222', 'Jane', 'Smith', '987654321');
```

### Test Case 1: SELECT Policy

```sql
-- Simulate User 1 (Org 1) - Should see Org 1 participants only
SET request.jwt.claims = '{"sub": "user-1-uuid", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111", "role": "admin"}}';

SELECT * FROM participants; -- Should return John Doe only

-- Simulate User 3 (Org 2) - Should see Org 2 participants only
SET request.jwt.claims = '{"sub": "user-3-uuid", "app_metadata": {"organization_id": "22222222-2222-2222-2222-222222222222", "role": "admin"}}';

SELECT * FROM participants; -- Should return Jane Smith only

-- EXPECTED: Each user only sees their organization's data
-- FAIL IF: User can see participants from other organizations
```

### Test Case 2: INSERT Policy

```sql
-- Simulate User 2 (Org 1, Clinician) - Should be able to insert
SET request.jwt.claims = '{"sub": "user-2-uuid", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111", "role": "clinician"}}';

INSERT INTO participants (organization_id, first_name, last_name, ndis_number)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test', 'Participant', '111222333');
-- Should succeed

-- Try to insert into another organization
INSERT INTO participants (organization_id, first_name, last_name, ndis_number)
VALUES ('22222222-2222-2222-2222-222222222222', 'Bad', 'Insert', '444555666');
-- Should FAIL with permission denied

-- EXPECTED: Can only insert into own organization
-- FAIL IF: Can insert into other organization
```

### Test Case 3: UPDATE Policy

```sql
-- Simulate User 1 (Org 1) trying to update Org 1 participant
SET request.jwt.claims = '{"sub": "user-1-uuid", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111", "role": "admin"}}';

UPDATE participants
SET first_name = 'Updated'
WHERE ndis_number = '123456789';
-- Should succeed

-- Try to update Org 2 participant
UPDATE participants
SET first_name = 'Hacked'
WHERE ndis_number = '987654321';
-- Should FAIL (no rows updated)

-- EXPECTED: Can only update own organization's data
-- FAIL IF: Can update other organization's data
```

### Test Case 4: DELETE Policy (Admin Only)

```sql
-- Simulate clinician trying to delete
SET request.jwt.claims = '{"sub": "user-2-uuid", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111", "role": "clinician"}}';

DELETE FROM participants WHERE ndis_number = '123456789';
-- Should FAIL (permission denied)

-- Simulate admin trying to delete
SET request.jwt.claims = '{"sub": "user-1-uuid", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111", "role": "admin"}}';

DELETE FROM participants WHERE ndis_number = '123456789';
-- Should succeed

-- EXPECTED: Only admins can delete
-- FAIL IF: Clinicians can delete
```

### Test Case 5: Cross-Table Access

```sql
-- Test that sessions can only be created for participants in same org
SET request.jwt.claims = '{"sub": "user-2-uuid", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111", "role": "clinician"}}';

-- Get Org 2 participant ID
SELECT id FROM participants WHERE organization_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;

-- Try to create session for Org 2 participant
INSERT INTO sessions (
  organization_id,
  participant_id,
  clinician_id,
  session_date,
  duration_minutes,
  session_type
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '[org-2-participant-id]', -- This should fail
  'user-2-uuid',
  NOW(),
  60,
  'therapy'
);
-- Should FAIL (foreign key violation or RLS)

-- EXPECTED: Cannot create sessions for participants in other orgs
-- FAIL IF: Session created successfully
```

## Automated Testing Script

```typescript
// tests/rls.test.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for setup
);

describe('RLS Policies', () => {
  const org1Id = '11111111-1111-1111-1111-111111111111';
  const org2Id = '22222222-2222-2222-2222-222222222222';
  
  let user1Client: SupabaseClient; // Org 1, Admin
  let user2Client: SupabaseClient; // Org 1, Clinician
  let user3Client: SupabaseClient; // Org 2, Admin

  beforeAll(async () => {
    // Setup test data
    await setupTestData();
    
    // Create clients with different user JWTs
    user1Client = createClientForUser('user1@org1.com');
    user2Client = createClientForUser('user2@org1.com');
    user3Client = createClientForUser('user3@org2.com');
  });

  describe('Participants Table', () => {
    it('should only show participants from own organization', async () => {
      const { data: user1Data } = await user1Client
        .from('participants')
        .select('*');
      
      expect(user1Data?.every(p => p.organization_id === org1Id)).toBe(true);

      const { data: user3Data } = await user3Client
        .from('participants')
        .select('*');
      
      expect(user3Data?.every(p => p.organization_id === org2Id)).toBe(true);
    });

    it('should prevent inserting into other organization', async () => {
      const { error } = await user1Client
        .from('participants')
        .insert({
          organization_id: org2Id, // Different org!
          first_name: 'Bad',
          last_name: 'Insert',
          ndis_number: '000000000'
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('violates row-level security policy');
    });

    it('should allow admins to delete but not clinicians', async () => {
      // Create test participant
      const { data: participant } = await user1Client
        .from('participants')
        .insert({
          organization_id: org1Id,
          first_name: 'Delete',
          last_name: 'Test',
          ndis_number: '999999999'
        })
        .select()
        .single();

      // Clinician tries to delete
      const { error: clinicianError } = await user2Client
        .from('participants')
        .delete()
        .eq('id', participant!.id);

      expect(clinicianError).toBeTruthy();

      // Admin deletes successfully
      const { error: adminError } = await user1Client
        .from('participants')
        .delete()
        .eq('id', participant!.id);

      expect(adminError).toBeFalsy();
    });
  });

  describe('Sessions Table', () => {
    it('should prevent creating sessions for participants in other orgs', async () => {
      // Get a participant from Org 2
      const { data: org2Participants } = await user3Client
        .from('participants')
        .select('id')
        .limit(1);

      // User from Org 1 tries to create session for Org 2 participant
      const { error } = await user1Client
        .from('sessions')
        .insert({
          organization_id: org1Id,
          participant_id: org2Participants![0].id,
          session_date: new Date().toISOString(),
          duration_minutes: 60,
          session_type: 'therapy'
        });

      expect(error).toBeTruthy();
    });
  });

  // Add more test cases...
});
```

## RLS Verification Checklist

```markdown
For each table, verify:

- [ ] RLS is enabled
- [ ] SELECT policy filters by organization_id
- [ ] INSERT policy validates organization_id
- [ ] UPDATE policy checks organization_id
- [ ] DELETE policy checks role (if restricted)
- [ ] No policy allows USING (true) without filters
- [ ] Policies reference auth.user_organization_id()
- [ ] Cross-table operations respect RLS
- [ ] Service role bypasses RLS (for admin functions)
- [ ] Anonymous users have no access (unless public table)
```

## Common RLS Mistakes

```sql
-- ❌ MISTAKE 1: Allowing all access
CREATE POLICY "bad_policy" ON table_name
  FOR ALL USING (true); -- NEVER DO THIS

-- ✅ FIX: Add organization filter
CREATE POLICY "good_policy" ON table_name
  FOR ALL USING (organization_id = auth.user_organization_id());


-- ❌ MISTAKE 2: Forgetting WITH CHECK on INSERT
CREATE POLICY "bad_insert" ON table_name
  FOR INSERT USING (organization_id = auth.user_organization_id());
  -- Missing WITH CHECK!

-- ✅ FIX: Add WITH CHECK
CREATE POLICY "good_insert" ON table_name
  FOR INSERT WITH CHECK (organization_id = auth.user_organization_id());


-- ❌ MISTAKE 3: Not checking role for sensitive operations
CREATE POLICY "bad_delete" ON table_name
  FOR DELETE USING (organization_id = auth.user_organization_id());
  -- Anyone in org can delete!

-- ✅ FIX: Add role check
CREATE POLICY "good_delete" ON table_name
  FOR DELETE USING (
    organization_id = auth.user_organization_id() AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );


-- ❌ MISTAKE 4: Hardcoding user ID
CREATE POLICY "bad_user" ON table_name
  FOR ALL USING (user_id = 'hardcoded-uuid');
  -- Won't work for other users!

-- ✅ FIX: Use auth.uid()
CREATE POLICY "good_user" ON table_name
  FOR ALL USING (user_id = auth.uid());
```

## Debugging RLS Issues

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View all policies on a table
SELECT * FROM pg_policies WHERE tablename = 'participants';

-- Test policy as specific user (use psql)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-id", "app_metadata": {"organization_id": "org-id", "role": "admin"}}';
SELECT * FROM participants; -- See what this user can see
RESET ROLE;

-- Check what auth.uid() returns
SELECT auth.uid();

-- Check what auth.user_organization_id() returns
SELECT auth.user_organization_id();
```

## Performance Testing

```sql
-- Test query performance with RLS
EXPLAIN ANALYZE
SELECT * FROM participants
WHERE organization_id = auth.user_organization_id();

-- Should use index scan, not sequential scan
-- Look for: "Index Scan using idx_participants_org"
-- Avoid: "Seq Scan on participants"

-- If you see Seq Scan, add index:
CREATE INDEX CONCURRENTLY idx_participants_org 
  ON participants(organization_id);
```

Remember: Test RLS in staging before deploying to production!
