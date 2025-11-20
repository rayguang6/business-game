-- ============================================
-- DENTAL INDUSTRY - Complete Setup (Seed Data)
-- ============================================
-- This file creates a complete dental industry with all required data:
-- Industry, Config, Services, Upgrades, Marketing, Events, Flags, Staff
-- 
-- This is SEED DATA - run this to populate/update the database with initial data
-- Effects format: {"metric": "validMetric", "type": "validType", "value": number}
-- No priority field - effects are applied by type order (Add → Percent → Multiply → Set)
-- ============================================
-- Game Design Philosophy:
-- - Patient care: Balance quality service with efficiency
-- - Equipment: Invest in better tools for faster service
-- - Staff: Hire assistants to handle workload
-- - Growth: Expand rooms and services to serve more patients
-- ============================================

-- Step 1: Create Industry
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
    "startingSkillLevel": 20,
    "startingFreedomScore": 160
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
-- Effects format: {"metric": "validMetric", "type": "validType", "value": number}
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
    '[{"metric": "skillLevel", "type": "add", "value": 2}]'::jsonb,
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
    '[{"metric": "skillLevel", "type": "add", "value": 2}]'::jsonb,
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
-- Marketing effects include durationSeconds for temporary effects
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
    '[{"metric": "skillLevel", "type": "add", "value": 1, "durationSeconds": 3600}]'::jsonb,
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
    '[{"metric": "skillLevel", "type": "add", "value": 2, "durationSeconds": 1800}]'::jsonb,
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
    '[{"metric": "skillLevel", "type": "add", "value": 1, "durationSeconds": 3600}]'::jsonb,
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
-- Event effects use EventEffectType: "cash", "skillLevel", "dynamicCash", or "metric"
INSERT INTO events (id, industry_id, title, category, summary, choices, requirements)
VALUES 
  (
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
              {"type": "skillLevel", "amount": 5, "label": "Good service"}
            ]
          },
          {
            "id": "complicated",
            "label": "Complicated case",
            "description": "Took longer than expected",
            "weight": 30,
            "effects": [
              {"type": "cash", "amount": 200, "label": "Partial payment"},
              {"type": "skillLevel", "amount": 2, "label": "Learning experience"}
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
  ),
  (
    'equipment-breakdown',
    'dental',
    'Equipment Breakdown',
    'risk',
    'Your dental chair breaks down. You need to fix it or replace it.',
    '[
      {
        "id": "repair",
        "label": "Repair quickly",
        "description": "Get it fixed immediately",
        "cost": 500,
        "consequences": [
          {
            "id": "fixed",
            "label": "Fixed quickly",
            "description": "Equipment repaired, minimal downtime",
            "weight": 80,
            "effects": []
          },
          {
            "id": "still-broken",
            "label": "Still having issues",
            "description": "Repair didn''t work well",
            "weight": 20,
            "effects": [
              {"type": "cash", "amount": -300, "label": "Additional repair cost"},
              {"type": "skillLevel", "amount": -2, "label": "Frustration"}
            ]
          }
        ]
      },
      {
        "id": "replace",
        "label": "Replace equipment",
        "description": "Buy new equipment",
        "cost": 2000,
        "consequences": [
          {
            "id": "upgraded",
            "label": "Better equipment",
            "description": "New equipment works great",
            "weight": 100,
            "effects": [
              {"type": "metric", "metric": "serviceSpeedMultiplier", "effectType": "percent", "value": 5, "durationSeconds": null}
            ]
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
            "id": "struggled",
            "label": "Productivity suffered",
            "description": "Backup equipment is slow",
            "weight": 100,
            "effects": [
              {"type": "skillLevel", "amount": -3, "label": "Patient complaints"}
            ]
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'patient-referral',
    'dental',
    'New Patient Referral',
    'opportunity',
    'A satisfied patient wants to refer their friend. This could bring in more business!',
    '[
      {
        "id": "accept",
        "label": "Accept the referral",
        "description": "Welcome the new patient",
        "cost": 0,
        "consequences": [
          {
            "id": "success",
            "label": "New patient signed up",
            "description": "The referral worked out well!",
            "weight": 100,
            "effects": [
              {"type": "cash", "amount": 300, "label": "New patient deposit"},
              {"type": "skillLevel", "amount": 3, "label": "Word of mouth"}
            ]
          }
        ]
      },
      {
        "id": "decline",
        "label": "Politely decline",
        "description": "Focus on current patients",
        "cost": 0,
        "consequences": [
          {
            "id": "neutral",
            "label": "No change",
            "description": "You continue with your current patients",
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

-- Step 7: Flags (for tracking progress)
INSERT INTO flags (id, industry_id, name, description)
VALUES 
  ('has-extra-room', 'dental', 'Has Extra Room', 'You have an additional treatment room'),
  ('has-better-equipment', 'dental', 'Has Better Equipment', 'You have upgraded dental equipment'),
  ('learned-implant', 'dental', 'Learned Implant Procedures', 'You can perform dental implant procedures'),
  ('has-better-waiting', 'dental', 'Has Better Waiting Area', 'You have an improved waiting area'),
  ('has-assistant', 'dental', 'Has Dental Assistant', 'You have hired a dental assistant'),
  ('has-receptionist', 'dental', 'Has Receptionist', 'You have hired a receptionist')
ON CONFLICT (industry_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Step 8: Staff Roles (2 roles)
-- Staff effects format: {"metric": "validMetric", "type": "validType", "value": number}
INSERT INTO staff_roles (id, industry_id, name, salary, effects, emoji, sets_flag, requirements)
VALUES 
  (
    'dental-assistant',
    'dental',
    'Dental Assistant',
    2500,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 8},
      {"metric": "freedomScore", "type": "add", "value": -15}
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
      {"metric": "skillLevel", "type": "add", "value": 1},
      {"metric": "freedomScore", "type": "add", "value": -10}
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
