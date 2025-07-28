-- SQL query to manually assign admin role to the first user
-- After registering a user, run this query replacing 'your-email@example.com' with the actual email

-- First, let's see current user_roles to check if empty
-- SELECT * FROM user_roles;

-- To assign admin role to a specific user, use this query:
-- UPDATE user_roles 
-- SET role = 'admin'::app_role 
-- WHERE user_id = (
--   SELECT id FROM auth.users 
--   WHERE email = 'your-email@example.com'
-- );

-- Alternative: If no users exist in user_roles yet, the trigger should automatically
-- assign admin to the first user that registers

-- Let's verify the handle_new_user function is working properly
-- and ensure it assigns admin to first user correctly