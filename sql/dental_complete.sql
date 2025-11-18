-- ============================================
-- DENTAL INDUSTRY - Complete Basic Setup
-- ============================================
-- Simple but complete content for dental industry
-- Focus: Basic services, essential upgrades, simple events
-- ============================================

-- Step 1: Create/Update Industry
INSERT INTO industries (id, name, icon, description, is_available)
VALUES ('dental', 'Dental Clinic', '🦷', 'Run a dental clinic, treating patients and managing your practice.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_available = EXCLUDED.is_available;

-- Step 2: Industry Simulation Config
INSERT INTO industry_simulation_config (id, industry_id, business_metrics)
VALUES (
  'config-dental',
  'dental',
  '{
    "startingCash": 5000,
    "startingTime": 120,
    "monthlyExpenses": 3000,
    "startingReputation": 20,
    "founderWorkHours": 160
  }'::jsonb
)
ON CONFLICT (industry_id) DO UPDATE SET
  business_metrics = EXCLUDED.business_metrics;

-- Step 3: Services (5 basic dental services)
INSERT INTO services (id, industry_id, name, duration, price, pricing_category, weightage, requirements)
VALUES 
  ('cleaning', 'dental', 'Teeth Cleaning', 3, 100, 'low', 40, '[]'::jsonb),
  ('checkup', 'dental', 'Dental Checkup', 2, 80, 'low', 35, '[]'::jsonb),
  ('filling', 'dental', 'Cavity Filling', 5, 200, 'mid', 20, '[]'::jsonb),
  ('root-canal', 'dental', 'Root Canal', 8, 800, 'high', 10, '[]'::jsonb),
  ('crown', 'dental', 'Dental Crown', 10, 1200, 'high', 8, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  industry_id = EXCLUDED.industry_id,
  name = EXCLUDED.name,
  duration = EXCLUDED.duration,
  price = EXCLUDED.price,
  pricing_category = EXCLUDED.pricing_category,
  weightage = EXCLUDED.weightage,
  requirements = EXCLUDED.requirements;

-- Step 4: Upgrades (4 upgrades - mix of cash, time, and both)
INSERT INTO upgrades (id, industry_id, name, description, icon, cost, time_cost, max_level, effects, sets_flag, requirements)
VALUES 
  (
    'extra-room',
    'dental',
    'Extra Treatment Room',
    'Add another treatment room to serve more patients',
    '🏥',
    3000,
    NULL,
    1,
    '[{"metric": "serviceRooms", "type": "add", "value": 1}]'::jsonb,
    'has-extra-room',
    '[]'::jsonb
  ),
  (
    'better-equipment',
    'dental',
    'Better Equipment',
    'Upgrade dental equipment for faster service',
    '⚕️',
    5000,
    NULL,
    1,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 10},
      {"metric": "monthlyExpenses", "type": "add", "value": 200}
    ]'::jsonb,
    'has-better-equipment',
    '[]'::jsonb
  ),
  (
    'learn-implant',
    'dental',
    'Learn Implant Procedures',
    'Take continuing education course to offer dental implants',
    '📚',
    0,
    30,
    1,
    '[{"metric": "reputationMultiplier", "type": "add", "value": 0.2}]'::jsonb,
    'learned-implant',
    '[]'::jsonb
  ),
  (
    'waiting-area',
    'dental',
    'Improved Waiting Area',
    'Make the waiting area more comfortable',
    '🪑',
    2000,
    5,
    1,
    '[{"metric": "reputationMultiplier", "type": "add", "value": 0.15}]'::jsonb,
    'has-better-waiting',
    '[]'::jsonb
  )
ON CONFLICT (industry_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  cost = EXCLUDED.cost,
  time_cost = EXCLUDED.time_cost,
  max_level = EXCLUDED.max_level,
  effects = EXCLUDED.effects,
  sets_flag = EXCLUDED.sets_flag,
  requirements = EXCLUDED.requirements;

-- Step 5: Marketing Campaigns (3 campaigns - mix of cash and time)
INSERT INTO marketing_campaigns (id, industry_id, name, description, cost, time_cost, cooldown_seconds, effects, sets_flag, requirements)
VALUES 
  (
    'local-ad',
    'dental',
    'Local Advertisement',
    'Advertise in local newspaper',
    500,
    NULL,
    600,
    '[{"metric": "reputationMultiplier", "type": "add", "value": 0.1, "durationSeconds": 3600}]'::jsonb,
    NULL,
    '[]'::jsonb
  ),
  (
    'promotion',
    'dental',
    'Special Promotion',
    'Run a special discount promotion',
    300,
    NULL,
    300,
    '[{"metric": "reputationMultiplier", "type": "add", "value": 0.15, "durationSeconds": 1800}]'::jsonb,
    NULL,
    '[]'::jsonb
  ),
  (
    'networking',
    'dental',
    'Professional Networking',
    'Attend dental association meetings',
    0,
    8,
    900,
    '[{"metric": "reputationMultiplier", "type": "add", "value": 0.12, "durationSeconds": 3600}]'::jsonb,
    NULL,
    '[]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  industry_id = EXCLUDED.industry_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  time_cost = EXCLUDED.time_cost,
  cooldown_seconds = EXCLUDED.cooldown_seconds,
  effects = EXCLUDED.effects,
  sets_flag = EXCLUDED.sets_flag,
  requirements = EXCLUDED.requirements;

-- Step 6: Events (3 basic events - mix of opportunity and risk)
-- Event 1: Emergency Patient (Opportunity)
INSERT INTO events (id, industry_id, title, category, summary, choices, requirements)
VALUES (
  'emergency-patient',
  'dental',
  'Emergency Patient',
  'opportunity',
  'A patient comes in with a dental emergency. This could be profitable but urgent.',
  '[
    {
      "id": "treat",
      "label": "Treat the emergency",
      "description": "Help the patient immediately",
      "cost": 0,
      "consequences": [
        {
          "id": "success",
          "label": "Treatment successful",
          "description": "Patient is grateful and pays well",
          "weight": 70,
          "effects": [
            {"type": "cash", "amount": 400, "label": "Emergency treatment fee"},
            {"type": "reputation", "amount": 5, "label": "Good service"}
          ]
        },
        {
          "id": "complicated",
          "label": "Complicated case",
          "description": "Took longer than expected",
          "weight": 30,
          "effects": [
            {"type": "cash", "amount": 200, "label": "Reduced fee"},
            {"type": "reputation", "amount": 2, "label": "Patient satisfied"}
          ]
        }
      ]
    },
    {
      "id": "refer",
      "label": "Refer to specialist",
      "description": "Send to another dentist",
      "cost": 0,
      "consequences": [
        {
          "id": "neutral",
          "label": "No change",
          "description": "Patient went elsewhere",
          "weight": 100,
          "effects": []
        }
      ]
    }
  ]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (industry_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  summary = EXCLUDED.summary,
  choices = EXCLUDED.choices,
  requirements = EXCLUDED.requirements;

-- Event 2: Equipment Breakdown (Risk)
INSERT INTO events (id, industry_id, title, category, summary, choices, requirements)
VALUES (
  'equipment-breakdown',
  'dental',
  'Equipment Breakdown',
  'risk',
  'One of your dental tools breaks down. You need to repair or replace it.',
  '[
    {
      "id": "repair",
      "label": "Repair immediately",
      "description": "Fix the equipment quickly",
      "cost": 800,
      "consequences": [
        {
          "id": "fixed",
          "label": "Equipment fixed",
          "description": "Back to normal operations",
          "weight": 100,
          "effects": []
        }
      ]
    },
    {
      "id": "wait",
      "label": "Wait and save",
      "description": "Use backup equipment",
      "cost": 0,
      "consequences": [
        {
          "id": "slower",
          "label": "Slower service",
          "description": "Backup equipment is slower",
          "weight": 100,
          "effects": [
            {"type": "reputation", "amount": -3, "label": "Longer wait times"}
          ]
        }
      ]
    }
  ]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (industry_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  summary = EXCLUDED.summary,
  choices = EXCLUDED.choices,
  requirements = EXCLUDED.requirements;

-- Event 3: Patient Referral (Opportunity)
INSERT INTO events (id, industry_id, title, category, summary, choices, requirements)
VALUES (
  'patient-referral',
  'dental',
  'Patient Referral',
  'opportunity',
  'A satisfied patient wants to refer a friend to your clinic.',
  '[
    {
      "id": "accept",
      "label": "Accept new patient",
      "description": "Welcome the referral",
      "cost": 0,
      "consequences": [
        {
          "id": "new-patient",
          "label": "New patient",
          "description": "Got a new regular patient",
          "weight": 100,
          "effects": [
            {"type": "reputation", "amount": 3, "label": "Word of mouth"}
          ]
        }
      ]
    },
    {
      "id": "decline",
      "label": "Politely decline",
      "description": "Too busy right now",
      "cost": 0,
      "consequences": [
        {
          "id": "missed",
          "label": "Missed opportunity",
          "description": "Patient went elsewhere",
          "weight": 100,
          "effects": []
        }
      ]
    }
  ]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (industry_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  summary = EXCLUDED.summary,
  choices = EXCLUDED.choices,
  requirements = EXCLUDED.requirements;

-- Step 7: Flags (basic flags)
INSERT INTO flags (id, industry_id, name, description)
VALUES 
  ('has-extra-room', 'dental', 'Has Extra Room', 'You have an additional treatment room'),
  ('has-better-equipment', 'dental', 'Has Better Equipment', 'You have upgraded dental equipment'),
  ('learned-implant', 'dental', 'Learned Implant Procedures', 'You can now offer dental implant services'),
  ('has-better-waiting', 'dental', 'Has Better Waiting Area', 'You have improved the waiting area')
ON CONFLICT (industry_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Step 8: Staff Roles (2 basic roles)
INSERT INTO staff_roles (id, industry_id, name, salary, effects, emoji, sets_flag, requirements)
VALUES 
  (
    'dental-assistant',
    'dental',
    'Dental Assistant',
    2500,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 8},
      {"metric": "founderWorkingHours", "type": "add", "value": -15}
    ]'::jsonb,
    '👩‍⚕️',
    'has-assistant',
    '[]'::jsonb
  ),
  (
    'receptionist',
    'dental',
    'Receptionist',
    2000,
    '[
      {"metric": "reputationMultiplier", "type": "add", "value": 0.1},
      {"metric": "founderWorkingHours", "type": "add", "value": -10}
    ]'::jsonb,
    '👨‍💼',
    'has-receptionist',
    '[]'::jsonb
  )
ON CONFLICT (industry_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  salary = EXCLUDED.salary,
  effects = EXCLUDED.effects,
  emoji = EXCLUDED.emoji,
  sets_flag = EXCLUDED.sets_flag,
  requirements = EXCLUDED.requirements;

