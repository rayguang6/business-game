-- ============================================
-- FREELANCE INDUSTRY - Complete Setup (Seed Data)
-- ============================================
-- This file creates a complete freelance industry with all required data:
-- Industry, Config, Services, Upgrades, Marketing, Events, Flags, Staff
-- 
-- This is SEED DATA - run this to populate/update the database with initial data
-- Effects format: {"metric": "validMetric", "type": "validType", "value": number}
-- No priority field - effects are applied by type order (Add → Percent → Multiply → Set)
-- ============================================
-- Game Design Philosophy:
-- - Time management: Learn to balance learning vs earning
-- - Cash flow: Handle irregular income and expenses
-- - Skill development: Long-term investment vs short-term cash
-- - Client management: Set boundaries, handle difficult situations
-- - Scaling: Hire help when ready
-- ============================================

-- Step 1: Create Industry
INSERT INTO industries (id, name, icon, description, is_available)
VALUES ('freelance', 'Freelance', '💼', 'Work as an independent freelancer, balancing time between learning skills and taking on projects.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_available = EXCLUDED.is_available;

-- Step 2: Industry Simulation Config
INSERT INTO industry_simulation_config (id, industry_id, business_metrics)
VALUES (
  'config-freelance',
  'freelance',
  '{
    "startingCash": 3000,
    "startingTime": 80,
    "monthlyExpenses": 1000,
    "startingSkillLevel": 0,
    "startingFreedomScore": 0
  }'::jsonb
)
ON CONFLICT (industry_id) DO UPDATE SET
  business_metrics = EXCLUDED.business_metrics;

-- Step 3: Services (7 items - progression from quick to complex)
INSERT INTO services (id, industry_id, name, duration, price, pricing_category, weightage, requirements)
VALUES 
  ('logo-quick', 'freelance', 'Quick Logo Design', 4, 200, 'low', 25, '[]'::jsonb),
  ('brand-consultation', 'freelance', 'Brand Consultation', 2, 150, 'low', 30, '[]'::jsonb),
  ('social-media-graphics', 'freelance', 'Social Media Graphics', 3, 180, 'low', 28, '[]'::jsonb),
  ('website-landing', 'freelance', 'Website Landing Page', 8, 500, 'mid', 20, '[{"type": "flag", "id": "learned-web-dev", "expected": true}]'::jsonb),
  ('brand-identity', 'freelance', 'Brand Identity Package', 10, 800, 'high', 15, '[{"type": "flag", "id": "learned-design", "expected": true}]'::jsonb),
  ('website-full', 'freelance', 'Full Website Development', 12, 1200, 'high', 12, '[{"type": "flag", "id": "learned-web-dev", "expected": true}]'::jsonb),
  ('ecommerce-site', 'freelance', 'E-commerce Website', 16, 2000, 'high', 10, '[{"type": "flag", "id": "learned-web-dev", "expected": true}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  industry_id = EXCLUDED.industry_id,
  name = EXCLUDED.name,
  duration = EXCLUDED.duration,
  price = EXCLUDED.price,
  pricing_category = EXCLUDED.pricing_category,
  weightage = EXCLUDED.weightage,
  requirements = EXCLUDED.requirements;

-- Step 4: Upgrades (5 items - skill and tool progression)
-- Effects format: {"metric": "validMetric", "type": "validType", "value": number}
INSERT INTO upgrades (id, industry_id, name, description, icon, cost, time_cost, max_level, effects, sets_flag, requirements)
VALUES 
  (
    'learn-design',
    'freelance',
    'Learn Design Basics',
    'Master the fundamentals of graphic design and branding',
    '🎨',
    0,
    20,
    1,
    '[{"metric": "skillLevel", "type": "add", "value": 1}]'::jsonb,
    'learned-design',
    '[]'::jsonb
  ),
  (
    'learn-web-dev',
    'freelance',
    'Learn Web Development',
    'Learn HTML, CSS, and JavaScript to build websites',
    '💻',
    0,
    40,
    1,
    '[{"metric": "skillLevel", "type": "add", "value": 2}]'::jsonb,
    'learned-web-dev',
    '[]'::jsonb
  ),
  (
    'portfolio-website',
    'freelance',
    'Portfolio Website',
    'Create a professional portfolio to showcase your work',
    '🌐',
    500,
    10,
    1,
    '[
      {"metric": "skillLevel", "type": "add", "value": 3},
      {"metric": "monthlyExpenses", "type": "add", "value": 50}
    ]'::jsonb,
    'has-portfolio',
    '[]'::jsonb
  ),
  (
    'professional-tools',
    'freelance',
    'Professional Tools Subscription',
    'Subscribe to premium design and development tools',
    '🛠️',
    200,
    2,
    1,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 5},
      {"metric": "monthlyExpenses", "type": "add", "value": 200}
    ]'::jsonb,
    'has-pro-tools',
    '[]'::jsonb
  ),
  (
    'client-management-system',
    'freelance',
    'Client Management System',
    'Invest in software to manage projects and invoices',
    '📊',
    300,
    5,
    1,
    '[
      {"metric": "skillLevel", "type": "add", "value": 2},
      {"metric": "monthlyExpenses", "type": "add", "value": 80}
    ]'::jsonb,
    'has-crm',
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

-- Step 5: Marketing Campaigns (4 items)
-- Marketing effects include durationSeconds for temporary effects
INSERT INTO marketing_campaigns (id, industry_id, name, description, cost, time_cost, cooldown_seconds, effects, sets_flag, requirements)
VALUES 
  (
    'social-media-post',
    'freelance',
    'Post on Social Media',
    'Share your work on social platforms',
    0,
    2,
    180,
    '[{"metric": "skillLevel", "type": "add", "value": 1, "durationSeconds": 1800}]'::jsonb,
    NULL,
    '[]'::jsonb
  ),
  (
    'update-portfolio',
    'freelance',
    'Update Portfolio',
    'Add recent work to your portfolio',
    0,
    5,
    300,
    '[{"metric": "skillLevel", "type": "add", "value": 2, "durationSeconds": 3600}]'::jsonb,
    NULL,
    '[{"type": "flag", "id": "has-portfolio", "expected": true}]'::jsonb
  ),
  (
    'cold-email-campaign',
    'freelance',
    'Cold Email Campaign',
    'Reach out to potential clients via email',
    0,
    8,
    600,
    '[{"metric": "skillLevel", "type": "add", "value": 1, "durationSeconds": 3600}]'::jsonb,
    NULL,
    '[]'::jsonb
  ),
  (
    'content-creation',
    'freelance',
    'Create Content',
    'Write blog posts or create tutorials to showcase expertise',
    0,
    12,
    900,
    '[{"metric": "skillLevel", "type": "add", "value": 2, "durationSeconds": 7200}]'::jsonb,
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

-- Step 6: Events (7 items - mix of opportunities and risks)
-- Event effects use EventEffectType: "cash", "skillLevel", "dynamicCash", or "metric"
INSERT INTO events (id, industry_id, title, category, summary, choices, requirements)
VALUES 
  (
    'client-referral',
    'freelance',
    'Client Referral',
    'opportunity',
    'A satisfied client wants to refer you to a friend. This could lead to more work!',
    '[
      {
        "id": "accept",
        "label": "Accept the referral",
        "description": "Take on the new client",
        "cost": 0,
        "consequences": [
          {
            "id": "success",
            "label": "New client signed",
            "description": "The referral worked out well!",
            "weight": 100,
            "effects": [
              {"type": "cash", "amount": 300, "label": "New project deposit"},
              {"type": "skillLevel", "amount": 5, "label": "Word of mouth"}
            ]
          }
        ]
      },
      {
        "id": "decline",
        "label": "Politely decline",
        "description": "Focus on current projects",
        "cost": 0,
        "consequences": [
          {
            "id": "neutral",
            "label": "No change",
            "description": "You continue with your current work",
            "weight": 100,
            "effects": []
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'late-payment',
    'freelance',
    'Late Payment',
    'risk',
    'A client is late paying their invoice. This affects your cash flow.',
    '[
      {
        "id": "follow-up",
        "label": "Send polite reminder",
        "description": "Follow up professionally",
        "cost": 0,
        "consequences": [
          {
            "id": "paid",
            "label": "Payment received",
            "description": "Client paid after reminder",
            "weight": 70,
            "effects": [
              {"type": "cash", "amount": 0, "label": "Payment delayed but received"}
            ]
          },
          {
            "id": "still-late",
            "label": "Still waiting",
            "description": "Payment still pending",
            "weight": 30,
            "effects": [
              {"type": "skillLevel", "amount": -2, "label": "Frustration"}
            ]
          }
        ]
      },
      {
        "id": "wait",
        "label": "Wait patiently",
        "description": "Give them more time",
        "cost": 0,
        "consequences": [
          {
            "id": "eventually-paid",
            "label": "Eventually paid",
            "description": "Client paid but very late",
            "weight": 60,
            "effects": []
          },
          {
            "id": "lost",
            "label": "Lost payment",
            "description": "Never received payment",
            "weight": 40,
            "effects": [
              {"type": "cash", "amount": -500, "label": "Lost invoice"},
              {"type": "skillLevel", "amount": -5, "label": "Bad experience"}
            ]
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'scope-creep',
    'freelance',
    'Scope Creep',
    'risk',
    'A client is asking for additional work beyond the original agreement. This will take more time.',
    '[
      {
        "id": "charge-extra",
        "label": "Charge extra for additional work",
        "description": "Set boundaries and charge appropriately",
        "cost": 0,
        "consequences": [
          {
            "id": "accepted",
            "label": "Client agreed",
            "description": "Client accepted the additional charge",
            "weight": 60,
            "effects": [
              {"type": "cash", "amount": 200, "label": "Additional payment"},
              {"type": "skillLevel", "amount": 2, "label": "Professional boundaries"}
            ]
          },
          {
            "id": "declined",
            "label": "Client declined",
            "description": "Client refused to pay extra",
            "weight": 40,
            "effects": [
              {"type": "skillLevel", "amount": -3, "label": "Unhappy client"}
            ]
          }
        ]
      },
      {
        "id": "do-free",
        "label": "Do it for free",
        "description": "Keep the client happy",
        "cost": 0,
        "consequences": [
          {
            "id": "happy",
            "label": "Client happy",
            "description": "Client appreciates the extra effort",
            "weight": 70,
            "effects": [
              {"type": "skillLevel", "amount": 3, "label": "Good relationship"}
            ]
          },
          {
            "id": "expects-more",
            "label": "Expects more free work",
            "description": "Client now expects free extras",
            "weight": 30,
            "effects": [
              {"type": "skillLevel", "amount": -2, "label": "Boundary issues"}
            ]
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'big-project',
    'freelance',
    'Big Project Opportunity',
    'opportunity',
    'A potential client offers a large project, but it requires skills you don''t have yet.',
    '[
      {
        "id": "learn-and-accept",
        "label": "Learn the skill and accept",
        "description": "Invest time to learn, then take the project",
        "cost": 0,
        "consequences": [
          {
            "id": "success",
            "label": "Project completed",
            "description": "You learned and delivered successfully",
            "weight": 60,
            "effects": [
              {"type": "cash", "amount": 2000, "label": "Large project payment"},
              {"type": "skillLevel", "amount": 10, "label": "Major achievement"}
            ]
          },
          {
            "id": "struggled",
            "label": "Struggled with project",
            "description": "Learning curve was steep",
            "weight": 40,
            "effects": [
              {"type": "cash", "amount": 1000, "label": "Reduced payment"},
              {"type": "skillLevel", "amount": -3, "label": "Quality issues"}
            ]
          }
        ]
      },
      {
        "id": "decline",
        "label": "Politely decline",
        "description": "Stick to what you know",
        "cost": 0,
        "consequences": [
          {
            "id": "safe",
            "label": "Stayed in comfort zone",
            "description": "No risk, but no growth",
            "weight": 100,
            "effects": []
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'difficult-client',
    'freelance',
    'Difficult Client',
    'risk',
    'A client is being very demanding and unreasonable with revisions.',
    '[
      {
        "id": "stand-firm",
        "label": "Set boundaries",
        "description": "Limit revisions per contract",
        "cost": 0,
        "consequences": [
          {
            "id": "respected",
            "label": "Client respected boundaries",
            "description": "Professional approach worked",
            "weight": 50,
            "effects": [
              {"type": "skillLevel", "amount": 2, "label": "Professionalism"}
            ]
          },
          {
            "id": "fired",
            "label": "Lost the client",
            "description": "Client fired you",
            "weight": 50,
            "effects": [
              {"type": "skillLevel", "amount": -5, "label": "Lost client"},
              {"type": "cash", "amount": -300, "label": "Lost project"}
            ]
          }
        ]
      },
      {
        "id": "accommodate",
        "label": "Accommodate requests",
        "description": "Keep the client happy",
        "cost": 0,
        "consequences": [
          {
            "id": "happy",
            "label": "Client satisfied",
            "description": "Extra effort paid off",
            "weight": 40,
            "effects": [
              {"type": "skillLevel", "amount": 1, "label": "Client happy"}
            ]
          },
          {
            "id": "burnout",
            "label": "Burned out",
            "description": "Too much work, quality suffered",
            "weight": 60,
            "effects": [
              {"type": "skillLevel", "amount": -4, "label": "Quality issues"},
              {"type": "cash", "amount": -200, "label": "Refund"}
            ]
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'networking-event',
    'freelance',
    'Networking Event',
    'opportunity',
    'A local business networking event could lead to new clients, but it costs time.',
    '[
      {
        "id": "attend",
        "label": "Attend the event",
        "description": "Invest time in networking",
        "cost": 0,
        "consequences": [
          {
            "id": "met-clients",
            "label": "Met potential clients",
            "description": "Made valuable connections",
            "weight": 60,
            "effects": [
              {"type": "skillLevel", "amount": 5, "label": "Networking success"},
              {"type": "cash", "amount": 400, "label": "New project from connection"}
            ]
          },
          {
            "id": "waste-time",
            "label": "Wasted time",
            "description": "Event wasn''t productive",
            "weight": 40,
            "effects": []
          }
        ]
      },
      {
        "id": "skip",
        "label": "Skip the event",
        "description": "Focus on current work",
        "cost": 0,
        "consequences": [
          {
            "id": "missed",
            "label": "Missed opportunity",
            "description": "Stayed focused but missed connections",
            "weight": 100,
            "effects": []
          }
        ]
      }
    ]'::jsonb,
    '[]'::jsonb
  ),
  (
    'equipment-upgrade',
    'freelance',
    'Equipment Upgrade Needed',
    'risk',
    'Your computer is slowing down and affecting productivity. You need to upgrade.',
    '[
      {
        "id": "upgrade-now",
        "label": "Upgrade now",
        "description": "Invest in better equipment",
        "cost": 1500,
        "consequences": [
          {
            "id": "improved",
            "label": "Productivity improved",
            "description": "New equipment helps you work faster",
            "weight": 100,
            "effects": [
              {"type": "metric", "metric": "serviceSpeedMultiplier", "effectType": "percent", "value": 10, "durationSeconds": null}
            ]
          }
        ]
      },
      {
        "id": "wait",
        "label": "Wait and save",
        "description": "Keep using old equipment",
        "cost": 0,
        "consequences": [
          {
            "id": "struggled",
            "label": "Productivity suffered",
            "description": "Old equipment slows you down",
            "weight": 100,
            "effects": [
              {"type": "skillLevel", "amount": -2, "label": "Delayed projects"}
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

-- Step 7: Flags (for tracking progress)
INSERT INTO flags (id, industry_id, name, description)
VALUES 
  ('learned-design', 'freelance', 'Learned Design', 'You have learned design basics'),
  ('learned-web-dev', 'freelance', 'Learned Web Development', 'You have learned web development'),
  ('has-portfolio', 'freelance', 'Has Portfolio', 'You have a professional portfolio website'),
  ('has-pro-tools', 'freelance', 'Has Professional Tools', 'You have premium tool subscriptions'),
  ('has-crm', 'freelance', 'Has CRM System', 'You use a client management system'),
  ('has-junior-designer', 'freelance', 'Has Junior Designer', 'You have hired a junior designer'),
  ('has-junior-developer', 'freelance', 'Has Junior Developer', 'You have hired a junior developer')
ON CONFLICT (industry_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Step 8: Staff Roles (3 roles)
-- Staff effects format: {"metric": "validMetric", "type": "validType", "value": number}
INSERT INTO staff_roles (id, industry_id, name, salary, effects, sets_flag, requirements, sprite_image)
VALUES
  (
    'virtual-assistant',
    'freelance',
    'Virtual Assistant',
    800,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 5},
      {"metric": "freedomScore", "type": "add", "value": -1}
    ]'::jsonb,
    NULL,
    '[]'::jsonb,
    '/images/staff/staff1.png'
  ),
  (
    'junior-designer',
    'freelance',
    'Junior Designer',
    1200,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 8},
      {"metric": "freedomScore", "type": "add", "value": -1}
    ]'::jsonb,
    'has-junior-designer',
    '[{"type": "flag", "id": "learned-design", "expected": true}]'::jsonb,
    '/images/staff/staff1.png'
  ),
  (
    'junior-developer',
    'freelance',
    'Junior Developer',
    1500,
    '[
      {"metric": "serviceSpeedMultiplier", "type": "percent", "value": 10},
      {"metric": "freedomScore", "type": "add", "value": -2}
    ]'::jsonb,
    'has-junior-developer',
    '[{"type": "flag", "id": "learned-web-dev", "expected": true}]'::jsonb,
    '/images/staff/staff1.png'
  )
ON CONFLICT (industry_id, id) DO UPDATE SET
  name = EXCLUDED.name,
  salary = EXCLUDED.salary,
  effects = EXCLUDED.effects,
  sets_flag = EXCLUDED.sets_flag,
  requirements = EXCLUDED.requirements,
  sprite_image = EXCLUDED.sprite_image;
