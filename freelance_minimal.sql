-- Freelance Web Designer Industry - Minimal Configuration
-- Keep global settings same, customize only industry-specific values

-- ========================================
-- INDUSTRY DEFINITION
-- ========================================
INSERT INTO industries (id, name, icon, description, image, map_image, is_available) VALUES
('freelance', 'Freelance Web Designer', '💻', 'Build websites and digital products as an independent web designer!', '/images/industries/freelance.jpg', '/images/maps/freelance-map.png', true);

-- ========================================
-- INDUSTRY SIMULATION CONFIG (STARTING VALUES)
-- ========================================
INSERT INTO industry_simulation_configs (
    industry_id,
    business_metrics,
    business_stats,
    win_condition,
    lose_condition
) VALUES (
    'freelance',
    '{
        "startingCash": 2000,
        "monthlyExpenses": 500,
        "startingExp": 0,
        "startingFreedomScore": 0,
        "startingTime": 100
    }'::jsonb,
    '{
        "customerSpawnIntervalSeconds": 4,
        "customerPatienceSeconds": 12,
        "serviceRevenueMultiplier": 0.8,
        "serviceRevenueScale": 8,
        "failureRate": 15,
        "serviceCapacity": 1,
        "conversionRate": 12
    }'::jsonb,
    '{"monthTarget": 10}'::jsonb,
    '{"cashThreshold": 0, "timeThreshold": 0}'::jsonb
);

-- ========================================
-- SERVICES (3 minimal services)
-- ========================================
INSERT INTO services (id, industry_id, name, description, duration, price, requirements, pricing_category, weightage) VALUES
('basic_website', 'freelance', 'Basic Website', 'Simple business website with 5 pages', 2, 800, '[]'::jsonb, 'low', 60),
('ecommerce_site', 'freelance', 'E-commerce Store', 'Online store with payment integration', 4, 2500, '[]'::jsonb, 'mid', 30),
('custom_web_app', 'freelance', 'Custom Web App', 'Complex web application with custom features', 8, 5000, '[{"type": "level", "level": 3}]'::jsonb, 'high', 10);

-- ========================================
-- UPGRADES (3 minimal upgrades)
-- ========================================
INSERT INTO upgrades (id, industry_id, name, description, icon, cost, max_level, effects, requirements) VALUES
('better_computer', 'freelance', 'Better Computer', 'Faster development with better hardware', '💻', '500 + (level * 300)', 3,
 '[{"metric": "serviceSpeedMultiplier", "type": "percent", "value": 15}]'::jsonb, '[]'::jsonb),

('online_courses', 'freelance', 'Online Courses', 'Learn new technologies and frameworks', '📚', '200 + (level * 150)', 5,
 '[{"metric": "exp", "type": "add", "value": 20}, {"metric": "serviceRevenueMultiplier", "type": "percent", "value": 8}]'::jsonb, '[]'::jsonb),

('freelance_platform', 'freelance', 'Platform Premium', 'Access to premium freelance platforms', '⭐', '100 + (level * 50)', 3,
 '[{"metric": "spawnIntervalSeconds", "type": "percent", "value": -10}]'::jsonb, '[]'::jsonb);

-- ========================================
-- MARKETING CAMPAIGNS (3 minimal campaigns)
-- ========================================
INSERT INTO marketing_campaigns (id, industry_id, name, description, cost, time_cost, cooldown_seconds, effects) VALUES
('social_media_post', 'freelance', 'Social Media Post', 'Share portfolio work on social media', 50, 1, 30,
 '[{"metric": "generateLeads", "type": "add", "value": 3}]'::jsonb),

('portfolio_update', 'freelance', 'Portfolio Update', 'Add recent projects to portfolio', 100, 2, 60,
 '[{"metric": "serviceRevenueMultiplier", "type": "percent", "value": 15, "durationSeconds": 60}]'::jsonb),

('networking_event', 'freelance', 'Networking Event', 'Attend local developer meetup', 150, 4, 120,
 '[{"metric": "conversionRate", "type": "add", "value": 5, "durationSeconds": 120}]'::jsonb);

-- ========================================
-- STAFF ROLES (3 minimal roles)
-- ========================================
INSERT INTO staff_roles (id, industry_id, name, description, icon, hire_cost, monthly_cost, effects) VALUES
('virtual_assistant', 'freelance', 'Virtual Assistant', 'Handles client communication and admin tasks', '👩‍💼', 300, 400,
 '[{"metric": "monthlyExpenses", "type": "add", "value": 400}, {"metric": "spawnIntervalSeconds", "type": "percent", "value": -15}]'::jsonb),

('mentor_coach', 'freelance', 'Mentor Coach', 'Provides guidance and code reviews', '👨‍🏫', 500, 600,
 '[{"metric": "monthlyExpenses", "type": "add", "value": 600}, {"metric": "exp", "type": "add", "value": 15}, {"metric": "failureRate", "type": "percent", "value": -20}]'::jsonb),

('accountant', 'freelance', 'Accountant', 'Manages finances and tax planning', '👨‍💼', 400, 500,
 '[{"metric": "monthlyExpenses", "type": "add", "value": 500}, {"metric": "monthlyTimeCapacity", "type": "add", "value": 20}]'::jsonb);

-- ========================================
-- STAFF PRESETS (initial staff available)
-- ========================================
INSERT INTO staff_presets (id, industry_id, staff_role_id, is_available) VALUES
('freelance_va', 'freelance', 'virtual_assistant', true),
('freelance_accountant', 'freelance', 'accountant', true);

-- ========================================
-- EVENTS (3 minimal events)
-- ========================================
INSERT INTO events (id, industry_id, name, description, trigger_seconds, choices) VALUES
('client_emergency', 'freelance', 'Client Emergency', 'Client needs urgent website fix', 20,
 '[
    {
        "text": "Fix it immediately",
        "consequences": [{
            "effects": [
                {"metric": "cash", "type": "add", "value": 300},
                {"metric": "time", "type": "add", "value": -3}
            ]
        }]
    },
    {
        "text": "Schedule for tomorrow",
        "consequences": [{
            "effects": [
                {"metric": "freedomScore", "type": "add", "value": -2}
            ]
        }]
    }
 ]'::jsonb),

('competition_win', 'freelance', 'Design Competition', 'Won a local web design competition!', 35,
 '[
    {
        "text": "Celebrate and network",
        "consequences": [{
            "effects": [
                {"metric": "exp", "type": "add", "value": 25},
                {"metric": "time", "type": "add", "value": -2}
            ]
        }]
    }
 ]'::jsonb),

('market_downturn', 'freelance', 'Market Slowdown', 'Fewer clients due to economic conditions', 50,
 '[
    {
        "text": "Cut prices to attract clients",
        "consequences": [{
            "effects": [
                {"metric": "serviceRevenueMultiplier", "type": "percent", "value": -15, "durationSeconds": 90},
                {"metric": "spawnIntervalSeconds", "type": "percent", "value": 25, "durationSeconds": 90}
            ]
        }]
    },
    {
        "text": "Focus on quality clients",
        "consequences": [{
            "effects": [
                {"metric": "serviceRevenueMultiplier", "type": "percent", "value": 10, "durationSeconds": 90},
                {"metric": "spawnIntervalSeconds", "type": "percent", "value": 15, "durationSeconds": 90}
            ]
        }]
    }
 ]'::jsonb);

-- ========================================
-- FLAGS (minimal flags)
-- ========================================
INSERT INTO flags (id, industry_id, name, description, is_unlocked_by_default) VALUES
('has_portfolio', 'freelance', 'Portfolio Complete', 'Has a professional portfolio website', true),
('premium_platform', 'freelance', 'Platform Premium', 'Has premium access to freelance platforms', false);

-- ========================================
-- CONDITIONS (minimal conditions)
-- ========================================
INSERT INTO conditions (id, industry_id, name, description, type, config) VALUES
('high_demand', 'freelance', 'High Demand Period', 'Peak season for web design projects', 'periodic',
 '{"periodSeconds": 180, "durationSeconds": 45}'::jsonb),

('low_demand', 'freelance', 'Slow Period', 'Fewer client inquiries', 'periodic',
 '{"periodSeconds": 240, "durationSeconds": 60}'::jsonb);
