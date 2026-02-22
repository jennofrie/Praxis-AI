-- Seed: 5 NDIS participants with plans and sessions
-- Safe to run multiple times (skips if participants already exist)

DO $$
DECLARE
  v_user_id UUID;
  v_p1 UUID := gen_random_uuid();
  v_p2 UUID := gen_random_uuid();
  v_p3 UUID := gen_random_uuid();
  v_p4 UUID := gen_random_uuid();
  v_p5 UUID := gen_random_uuid();
BEGIN
  -- Skip if data already exists
  IF (SELECT COUNT(*) FROM participants) > 0 THEN
    RAISE NOTICE 'Participants already seeded, skipping.';
    RETURN;
  END IF;

  -- Get first user from profiles
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No profiles found. Create a user first.';
    RETURN;
  END IF;

  -- Insert participants
  INSERT INTO participants (id, user_id, ndis_number, first_name, last_name, date_of_birth, primary_diagnosis, status, ai_consent)
  VALUES
    (v_p1, v_user_id, '4302119801', 'Lena', 'Watkins', '1990-03-15', 'Autism Spectrum Disorder', 'active', true),
    (v_p2, v_user_id, '8821330202', 'Marcus', 'Nguyen', '1985-07-22', 'Cerebral Palsy', 'active', true),
    (v_p3, v_user_id, '1029384703', 'Amara', 'Osei', '1992-11-08', 'Acquired Brain Injury', 'active', true),
    (v_p4, v_user_id, '5564229104', 'Jordan', 'Price', '1998-05-30', 'ADHD and Developmental Coordination Disorder', 'active', true),
    (v_p5, v_user_id, '9928110205', 'Priya', 'Sharma', '1978-09-12', 'Spinal Cord Injury', 'active', true);

  -- Insert NDIS plans
  INSERT INTO ndis_plans (participant_id, user_id, plan_number, plan_start_date, plan_end_date, total_budget, funding_type, status)
  VALUES
    (v_p1, v_user_id, 'PLAN-001-LW', NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months', 52000.00, 'plan-managed', 'active'),
    (v_p2, v_user_id, 'PLAN-002-MN', NOW() - INTERVAL '8 months', NOW() + INTERVAL '4 months', 85000.00, 'agency-managed', 'active'),
    (v_p3, v_user_id, 'PLAN-003-AO', NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', 72000.00, 'plan-managed', 'active'),
    (v_p4, v_user_id, 'PLAN-004-JP', NOW() - INTERVAL '10 months', NOW() + INTERVAL '2 months', 28000.00, 'self-managed', 'active'),
    (v_p5, v_user_id, 'PLAN-005-PS', NOW() - INTERVAL '5 months', NOW() + INTERVAL '7 months', 115000.00, 'plan-managed', 'active');

  -- Insert sessions: 2 completed + 1 scheduled per participant
  INSERT INTO sessions (participant_id, clinician_id, session_date, session_type, duration_minutes, status, billable, raw_notes)
  VALUES
    -- Lena Watkins
    (v_p1, v_user_id, NOW() - INTERVAL '14 days', 'assessment', 60, 'completed', true, 'Lena demonstrated strong verbal communication but showed difficulty with transitions between activities. Sensory processing observed to affect task initiation. Recommended sensory diet program.'),
    (v_p1, v_user_id, NOW() - INTERVAL '7 days', 'intervention', 90, 'completed', true, 'Worked on social communication skills using structured play. Lena responded positively to visual schedules. Goal progress: 65% on social reciprocity goal.'),
    (v_p1, v_user_id, NOW() + INTERVAL '3 days', 'review', 60, 'scheduled', true, 'Scheduled quarterly plan review session.'),

    -- Marcus Nguyen
    (v_p2, v_user_id, NOW() - INTERVAL '10 days', 'assessment', 90, 'completed', true, 'Marcus demonstrated upper limb spasticity impacting ADL performance. Grip strength 3/5 bilaterally. Functional reach within 30cm. Assistive technology assessment recommended.'),
    (v_p2, v_user_id, NOW() - INTERVAL '4 days', 'intervention', 60, 'completed', true, 'Commenced power wheelchair training. Marcus adapted quickly to joystick controls. Home modification assessment scheduled to address doorway widths.'),
    (v_p2, v_user_id, NOW() + INTERVAL '5 days', 'home-visit', 90, 'scheduled', true, 'Home modification assessment and AT trial.'),

    -- Amara Osei
    (v_p3, v_user_id, NOW() - INTERVAL '12 days', 'assessment', 60, 'completed', true, 'Amara presented with short-term memory deficits and processing speed challenges following ABI. Self-care largely independent with verbal prompting for sequencing tasks.'),
    (v_p3, v_user_id, NOW() - INTERVAL '5 days', 'intervention', 60, 'completed', true, 'Cognitive rehabilitation session focusing on memory strategies. Introduced calendar system and smartphone reminders. Amara engaged well with compensatory strategy training.'),
    (v_p3, v_user_id, NOW() + INTERVAL '7 days', 'telehealth', 45, 'scheduled', true, 'Telehealth follow-up on community re-engagement goals.'),

    -- Jordan Price
    (v_p4, v_user_id, NOW() - INTERVAL '9 days', 'assessment', 45, 'completed', true, 'Jordan showed significant attentional difficulties during structured tasks. Fine motor coordination below age norm. Handwriting assessment: legibility 40%, speed impacted.'),
    (v_p4, v_user_id, NOW() - INTERVAL '3 days', 'intervention', 60, 'completed', true, 'Sensory motor integration activities targeting proprioceptive and vestibular processing. Jordan responded well to movement breaks. Desk ergonomics assessment completed.'),
    (v_p4, v_user_id, NOW() + INTERVAL '4 days', 'intervention', 60, 'scheduled', true, 'Handwriting and fine motor skill session.'),

    -- Priya Sharma
    (v_p5, v_user_id, NOW() - INTERVAL '11 days', 'assessment', 90, 'completed', true, 'Priya presents with C5-C6 incomplete SCI. Independent manual wheelchair user on flat surfaces. Requires assistance on inclines. Home environment assessment identifies bathroom as primary barrier.'),
    (v_p5, v_user_id, NOW() - INTERVAL '6 days', 'intervention', 60, 'completed', true, 'Upper limb strengthening program and functional transfer training. Priya demonstrated improved transfer technique from wheelchair to toilet. Carer training provided.'),
    (v_p5, v_user_id, NOW() + INTERVAL '2 days', 'assessment', 90, 'scheduled', true, 'AT assessment: power add-on device for manual wheelchair.');

END $$;
