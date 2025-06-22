-- Drop password column from users table now that Supabase Auth stores credentials
ALTER TABLE users
  DROP COLUMN IF EXISTS password;

-- If you prefer to keep the column but allow NULLs instead, comment the above and use:
-- ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- No RLS changes are required because password was never exposed to clients.
