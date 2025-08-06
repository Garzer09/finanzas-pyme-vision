-- Update the handle_new_user trigger to not require company_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into user_profiles with minimal required data
  INSERT INTO public.user_profiles (user_id, company_name, subscription_status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Sin empresa'),
    'active'
  );
  
  -- Insert default role (always 'user' - admin promotion happens separately)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;