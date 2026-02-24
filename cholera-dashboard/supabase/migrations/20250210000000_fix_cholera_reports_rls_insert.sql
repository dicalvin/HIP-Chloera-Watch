-- Fix RLS: Replace permissive INSERT policy on cholera_reports so anon cannot insert.
-- Run this in Supabase SQL Editor or via: supabase db push

-- 1) Drop the existing permissive INSERT policy (name may vary; adjust if your policy has a different name)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'cholera_reports'
      AND schemaname = 'public'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cholera_reports', pol.policyname);
  END LOOP;
END $$;

-- 2) Create a secure INSERT policy: only authenticated users or service_role can insert
CREATE POLICY "Allow inserts from authenticated only"
  ON public.cholera_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3) Optional: if you also have an UPDATE policy that is too permissive, restrict it similarly
-- Uncomment and run if your scanner flags UPDATE as well:
/*
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'cholera_reports'
      AND schemaname = 'public'
      AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cholera_reports', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Allow updates from authenticated only"
  ON public.cholera_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
*/

-- 4) Allow service_role to insert/update (backend or migrations)
-- Service role bypasses RLS by default, so no policy is required for it.
