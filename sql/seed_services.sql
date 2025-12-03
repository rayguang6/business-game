-- Insert all service tiers for freelance industry
-- Small Tier Services (tier: 'small' - always available, all same values: 5h time, $500 price, 30 EXP)
INSERT INTO services (id, industry_id, name, duration, price, tier, exp_gained, pricing_category, weightage, time_cost) VALUES
('SJ01', 'freelance', 'Copywriting (Short Caption)', 5, 500, 'small', 30, 'low', 1, 5),
('SJ02', 'freelance', 'Thumbnail or Banner Design', 5, 500, 'small', 30, 'low', 1, 5),
('SJ03', 'freelance', 'Carousel Post Design', 5, 500, 'small', 30, 'low', 1, 5),
('SJ04', 'freelance', 'Social Media Post Design', 5, 500, 'small', 30, 'low', 1, 5),
('SJ05', 'freelance', 'Simple Video Cut (Reels/TikToks)', 5, 500, 'small', 30, 'low', 1, 5),
('SJ06', 'freelance', 'Automatic Sales Chatbot Setup', 5, 500, 'small', 30, 'low', 1, 5);

-- Medium Tier Services (tier: 'medium' - level 4+ required, all same values: 10h time, $1000 price, 60 EXP)
INSERT INTO services (id, industry_id, name, duration, price, tier, exp_gained, pricing_category, weightage, time_cost) VALUES
('MJ01', 'freelance', '1-Min Explainer Video', 10, 1000, 'medium', 60, 'mid', 1, 10),
('MJ02', 'freelance', 'Landing Page Copywriting', 10, 1000, 'medium', 60, 'mid', 1, 10),
('MJ03', 'freelance', 'Brand Identity Mini Pack', 10, 1000, 'medium', 60, 'mid', 1, 10),
('MJ04', 'freelance', 'Chatbot Flow Design (SME)', 10, 1000, 'medium', 60, 'mid', 1, 10),
('MJ05', 'freelance', 'Automatic Sales Funnel Design', 10, 1000, 'medium', 60, 'mid', 1, 10),
('MJ06', 'freelance', 'Short Video Campaign (3–5 videos)', 10, 1000, 'medium', 60, 'mid', 1, 10);

-- Big Tier Services (tier: 'big' - level 7+ required, all same values: 15h time, $1500 price, 120 EXP)
INSERT INTO services (id, industry_id, name, duration, price, tier, exp_gained, pricing_category, weightage, time_cost) VALUES
('BJ01', 'freelance', 'Corporate Video Campaign (5–10 videos)', 15, 1500, 'big', 120, 'high', 1, 15),
('BJ02', 'freelance', 'Full Website Copywriting (5–8 pages)', 15, 1500, 'big', 120, 'high', 1, 15),
('BJ03', 'freelance', 'Automation Deployment (Advanced)', 15, 1500, 'big', 120, 'high', 1, 15),
('BJ04', 'freelance', 'Full Brand Identity Campaign', 15, 1500, 'big', 120, 'high', 1, 15),
('BJ05', 'freelance', 'Multi-Month Retainer Campaign', 15, 1500, 'big', 120, 'high', 1, 15),
('BJ06', 'freelance', 'International Client Full Funnel Setup', 15, 1500, 'big', 120, 'high', 1, 15);
