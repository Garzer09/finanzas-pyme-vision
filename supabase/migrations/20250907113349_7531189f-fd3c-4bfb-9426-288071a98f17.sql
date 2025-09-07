-- Ensure user has membership to the company (needed to fix relationship error)
INSERT INTO public.memberships (user_id, company_id, role)
SELECT 
    au.id,
    'b396d500-a182-45fc-9323-41e89170daed'::uuid,
    'admin'
FROM auth.users au
LEFT JOIN public.memberships m ON m.user_id = au.id AND m.company_id = 'b396d500-a182-45fc-9323-41e89170daed'::uuid
WHERE m.user_id IS NULL
AND au.id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;