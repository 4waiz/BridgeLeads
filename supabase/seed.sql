-- Seed data for development
-- Note: You need to create a user first via the auth UI, then use that user's ID below.
-- Replace 'YOUR_USER_ID' with the actual UUID from auth.users after signup.

-- Example leads (run after creating a user):
-- Replace the UUID below with your actual user_id

/*
INSERT INTO public.leads (user_id, full_name, first_name, last_name, job_title, company, email, phone, website, domain, address, city, country, status, summary, source) VALUES
('YOUR_USER_ID', 'Sarah Chen', 'Sarah', 'Chen', 'VP of Procurement', 'ACME Industries', 'sarah.chen@acme.com', '+1 (555) 234-5678', 'https://acme.com', 'acme.com', '100 Market St', 'San Francisco', 'United States', 'new', 'VP of Procurement at ACME Industries with direct email and company domain present.', 'business_card'),
('YOUR_USER_ID', 'James Rodriguez', 'James', 'Rodriguez', 'Senior Developer', 'TechFlow Inc', 'james@techflow.io', '+1 (555) 345-6789', 'https://techflow.io', 'techflow.io', '200 Innovation Dr', 'Austin', 'United States', 'reviewed', 'Senior Developer at TechFlow Inc with direct email and company domain present.', 'business_card'),
('YOUR_USER_ID', 'Maria Gonzalez', 'Maria', 'Gonzalez', 'Marketing Director', 'BrightStar Media', 'maria.g@brightstar.co', '+44 20 7123 4567', 'https://brightstar.co', 'brightstar.co', '10 Fleet Street', 'London', 'United Kingdom', 'contacted', 'Marketing Director at BrightStar Media with direct email, phone number, company domain present.', 'business_card'),
('YOUR_USER_ID', 'David Kim', 'David', 'Kim', 'CTO', 'NovaTech Solutions', 'david.kim@novatech.dev', '+1 (555) 456-7890', 'https://novatech.dev', 'novatech.dev', '500 Tech Blvd', 'Seattle', 'United States', 'qualified', 'CTO at NovaTech Solutions with direct email, phone number, company domain present.', 'business_card'),
('YOUR_USER_ID', 'Emma Williams', 'Emma', 'Williams', 'Product Manager', 'CloudScale', 'emma@cloudscale.io', '+1 (555) 567-8901', 'https://cloudscale.io', 'cloudscale.io', NULL, 'New York', 'United States', 'new', 'Product Manager at CloudScale with direct email, phone number, company domain present.', 'business_card');

-- Example tags
INSERT INTO public.lead_tags (lead_id, user_id, tag) VALUES
((SELECT id FROM public.leads WHERE email = 'sarah.chen@acme.com' LIMIT 1), 'YOUR_USER_ID', 'enterprise'),
((SELECT id FROM public.leads WHERE email = 'sarah.chen@acme.com' LIMIT 1), 'YOUR_USER_ID', 'procurement'),
((SELECT id FROM public.leads WHERE email = 'james@techflow.io' LIMIT 1), 'YOUR_USER_ID', 'tech'),
((SELECT id FROM public.leads WHERE email = 'david.kim@novatech.dev' LIMIT 1), 'YOUR_USER_ID', 'decision-maker');
*/
