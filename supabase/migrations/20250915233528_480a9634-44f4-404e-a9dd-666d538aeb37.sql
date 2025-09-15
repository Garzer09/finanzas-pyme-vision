-- Add admin user membership to the company they're trying to access
INSERT INTO public.memberships (user_id, company_id, role)
VALUES ('40edeb28-584b-49ed-b767-cc2a96fb4f97', 'a4b7ab81-5b99-431d-8099-23decc69a532', 'admin')
ON CONFLICT (user_id, company_id) DO NOTHING;