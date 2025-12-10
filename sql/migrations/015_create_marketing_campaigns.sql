-- Create marketing campaigns for freelance industry
-- Migration: 015_create_marketing_campaigns.sql

-- Insert marketing campaigns
INSERT INTO marketing_campaigns (
  id,
  industry_id,
  name,
  description,
  campaign_type,
  cost,
  time_cost,
  cooldown_seconds,
  effects,
  order
) VALUES
-- Outreach - Unlimited campaign
(
  'outreach',
  'freelance',
  'Outreach',
  'Talk to people and stay active. A small but steady way to get new leads.',
  'unlimited',
  0,
  10,
  36000, -- 10 hours in seconds
  '[{"metric": "leads", "type": "add", "value": 1, "durationMonths": null}]'::jsonb,
  0
),
-- Social Posting - Leveled campaign (monthly effects)
(
  'social-posting',
  'freelance',
  'Social Posting',
  'Share updates on social media. Posting often helps more people notice you.',
  'leveled',
  null,
  null,
  50400, -- 14 hours in seconds
  null,
  1
),
-- Before/After Case Study - Leveled campaign (monthly effects)
(
  'case-study',
  'freelance',
  'Before/After Case Study',
  'Show real examples of your work. Helps people trust you and reach out.',
  'leveled',
  null,
  null,
  72000, -- 20 hours in seconds
  null,
  2
),
-- Templates/Assets - Leveled campaign (monthly effects)
(
  'templates-assets',
  'freelance',
  'Templates / Assets',
  'Create helpful or nice-looking content. Adds small attention to your page when shared.',
  'leveled',
  null,
  null,
  57600, -- 16 hours in seconds
  null,
  3
),
-- Professional Portfolio Redesign - Leveled campaign (permanent effects)
(
  'portfolio-redesign',
  'freelance',
  'Professional Portfolio Redesign',
  'Improve how your work looks. Makes people more willing to hire you.',
  'leveled',
  null,
  null,
  72000, -- 20 hours in seconds
  null,
  4
),
-- Studio Rebranding Video - Leveled campaign (permanent effects)
(
  'rebranding-video',
  'freelance',
  'Studio Rebranding Video',
  'A polished video that makes your brand look more professional and valuable.',
  'leveled',
  null,
  null,
  108000, -- 30 hours in seconds
  null,
  5
),
-- Press Release & Featured by Media - Leveled campaign (permanent effects)
(
  'press-release',
  'freelance',
  'Press Release & Featured by Media',
  'Get mentioned in media. Makes you look trusted and boosts your credibility.',
  'leveled',
  null,
  null,
  72000, -- 20 hours in seconds
  null,
  6
),
-- Digital Paid Ad Campaign - Leveled campaign (immediate leads)
(
  'paid-ads',
  'freelance',
  'Digital Paid Ad Campaign',
  'Run ads to reach more people quickly. Good for getting attention fast.',
  'leveled',
  null,
  null,
  18000, -- 5 hours in seconds
  null,
  7
);

-- Insert campaign levels for leveled campaigns
INSERT INTO marketing_campaign_levels (
  campaign_id,
  industry_id,
  level,
  name,
  cost,
  time_cost,
  effects
) VALUES
-- Social Posting levels (monthly leads)
(
  'social-posting',
  'freelance',
  1,
  'Level 1',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 1, "durationMonths": 1}]'::jsonb
),
(
  'social-posting',
  'freelance',
  2,
  'Level 2',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": 1}]'::jsonb
),
(
  'social-posting',
  'freelance',
  3,
  'Level 3',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": 1}]'::jsonb
),
(
  'social-posting',
  'freelance',
  4,
  'Level 4',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": 1}]'::jsonb
),
(
  'social-posting',
  'freelance',
  5,
  'Level 5',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 1, "durationMonths": 1}]'::jsonb
),

-- Before/After Case Study levels (monthly leads)
(
  'case-study',
  'freelance',
  1,
  'Level 1',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": 1}]'::jsonb
),
(
  'case-study',
  'freelance',
  2,
  'Level 2',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": 1}]'::jsonb
),
(
  'case-study',
  'freelance',
  3,
  'Level 3',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": 1}]'::jsonb
),
(
  'case-study',
  'freelance',
  4,
  'Level 4',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": 1}]'::jsonb
),
(
  'case-study',
  'freelance',
  5,
  'Level 5',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": 1}]'::jsonb
),

-- Templates/Assets levels (monthly leads)
(
  'templates-assets',
  'freelance',
  1,
  'Level 1',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 1, "durationMonths": 1}]'::jsonb
),
(
  'templates-assets',
  'freelance',
  2,
  'Level 2',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": 1}]'::jsonb
),
(
  'templates-assets',
  'freelance',
  3,
  'Level 3',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": 1}]'::jsonb
),
(
  'templates-assets',
  'freelance',
  4,
  'Level 4',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": 1}]'::jsonb
),
(
  'templates-assets',
  'freelance',
  5,
  'Level 5',
  0,
  10,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 1, "durationMonths": 1}]'::jsonb
),

-- Professional Portfolio Redesign levels (permanent effects)
(
  'portfolio-redesign',
  'freelance',
  1,
  'Level 1',
  500,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 1, "durationMonths": null}]'::jsonb
),
(
  'portfolio-redesign',
  'freelance',
  2,
  'Level 2',
  500,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 1, "durationMonths": null}]'::jsonb
),
(
  'portfolio-redesign',
  'freelance',
  3,
  'Level 3',
  500,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 1, "durationMonths": null}]'::jsonb
),
(
  'portfolio-redesign',
  'freelance',
  4,
  'Level 4',
  500,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 1, "durationMonths": null}]'::jsonb
),
(
  'portfolio-redesign',
  'freelance',
  5,
  'Level 5',
  500,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 2, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 1, "durationMonths": null}]'::jsonb
),

-- Studio Rebranding Video levels (permanent effects)
(
  'rebranding-video',
  'freelance',
  1,
  'Level 1',
  800,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": null}, {"metric": "serviceBonusPrice", "type": "add", "value": 15, "durationMonths": null}]'::jsonb
),
(
  'rebranding-video',
  'freelance',
  2,
  'Level 2',
  800,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": null}, {"metric": "serviceBonusPrice", "type": "add", "value": 15, "durationMonths": null}]'::jsonb
),
(
  'rebranding-video',
  'freelance',
  3,
  'Level 3',
  800,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 5, "durationMonths": null}, {"metric": "serviceBonusPrice", "type": "add", "value": 15, "durationMonths": null}]'::jsonb
),
(
  'rebranding-video',
  'freelance',
  4,
  'Level 4',
  800,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": null}, {"metric": "serviceBonusPrice", "type": "add", "value": 15, "durationMonths": null}]'::jsonb
),
(
  'rebranding-video',
  'freelance',
  5,
  'Level 5',
  800,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 3, "durationMonths": null}, {"metric": "serviceBonusPrice", "type": "add", "value": 15, "durationMonths": null}]'::jsonb
),

-- Press Release & Featured by Media levels (permanent effects)
(
  'press-release',
  'freelance',
  1,
  'Level 1',
  1200,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 2, "durationMonths": null}]'::jsonb
),
(
  'press-release',
  'freelance',
  2,
  'Level 2',
  1200,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 6, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 2, "durationMonths": null}]'::jsonb
),
(
  'press-release',
  'freelance',
  3,
  'Level 3',
  1200,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 8, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 2, "durationMonths": null}]'::jsonb
),
(
  'press-release',
  'freelance',
  4,
  'Level 4',
  1200,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 6, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 2, "durationMonths": null}]'::jsonb
),
(
  'press-release',
  'freelance',
  5,
  'Level 5',
  1200,
  20,
  '[{"metric": "leadsPerMonth", "type": "add", "value": 4, "durationMonths": null}, {"metric": "leadConversionRate", "type": "percent", "value": 2, "durationMonths": null}]'::jsonb
),

-- Digital Paid Ad Campaign levels (immediate leads)
(
  'paid-ads',
  'freelance',
  1,
  'Level 1',
  400,
  20,
  '[{"metric": "leads", "type": "add", "value": 3, "durationMonths": null}]'::jsonb
),
(
  'paid-ads',
  'freelance',
  2,
  'Level 2',
  400,
  20,
  '[{"metric": "leads", "type": "add", "value": 4, "durationMonths": null}]'::jsonb
),
(
  'paid-ads',
  'freelance',
  3,
  'Level 3',
  400,
  20,
  '[{"metric": "leads", "type": "add", "value": 5, "durationMonths": null}]'::jsonb
),
(
  'paid-ads',
  'freelance',
  4,
  'Level 4',
  400,
  20,
  '[{"metric": "leads", "type": "add", "value": 4, "durationMonths": null}]'::jsonb
),
(
  'paid-ads',
  'freelance',
  5,
  'Level 5',
  400,
  20,
  '[{"metric": "leads", "type": "add", "value": 2, "durationMonths": null}]'::jsonb
);

