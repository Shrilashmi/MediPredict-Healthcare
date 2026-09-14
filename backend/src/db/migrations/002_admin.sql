-- ============================================================================
-- MediPredict: Add Admin Role
-- ============================================================================

-- Remove the old role restriction
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new restriction including admin
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('patient', 'doctor', 'admin'));

-- ============================================================================
-- Success message
-- ============================================================================
DO $$ BEGIN
  RAISE NOTICE 'Admin role added successfully!';
END $$;