-- Function to create default user data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default user preferences
  INSERT INTO public.user_preferences (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  -- Create default collections
  INSERT INTO public.collections (name, description, color, icon, user_id)
  VALUES 
    ('Work', 'Work-related bookmarks and resources', '#6c47ff', 'briefcase', NEW.id),
    ('Personal', 'Personal interests and hobbies', '#00d8a4', 'user', NEW.id),
    ('Learning', 'Educational content and tutorials', '#ff47a0', 'book', NEW.id),
    ('Tools', 'Useful tools and utilities', '#f59e0b', 'wrench', NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
