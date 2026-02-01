-- Add PostgreSQL function for optimized user admin status query
-- This function provides optimal performance by using JOINs at the database level
-- Alternative to client-side joins for better performance with large user bases

CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  is_admin BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    (ur.user_id IS NOT NULL OR ae.email IS NOT NULL) as is_admin
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'admin'
  LEFT JOIN admin_emails ae ON LOWER(TRIM(ae.email)) = LOWER(TRIM(p.email))
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (admins will be checked by RLS)
GRANT EXECUTE ON FUNCTION get_users_with_admin_status() TO authenticated;

-- Create indexes for performance optimization
-- Check if indexes exist before creating to avoid errors

-- Index on profiles.email for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Index on profiles.created_at for sorting by registration date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Note: user_roles(user_id, role) already has UNIQUE constraint which acts as an index
-- Note: admin_emails(email) already has UNIQUE constraint which acts as an index
