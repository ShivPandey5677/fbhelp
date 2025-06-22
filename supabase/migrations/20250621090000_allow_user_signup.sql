-- Allow users to insert their own user record during signup
CREATE POLICY "Allow users to sign up"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read public user data (like names and avatars)
CREATE POLICY "Allow public read access to user profiles"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Update the existing update policy to be more specific
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);
