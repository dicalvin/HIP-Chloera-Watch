# RLS fix for `cholera_reports`

## What was fixed

The table `public.cholera_reports` had an RLS policy that allowed **anonymous** (`anon`) users to **INSERT** with no restriction (`WITH CHECK (true)`), which bypasses row-level security.

The migration **drops** that permissive INSERT policy and **creates** a new one so that only **authenticated** users can insert (and optionally update) rows.

## After running the migration

- **Anonymous users** can no longer insert or update rows (they can still read if you have a SELECT policy for them).
- **Authenticated users** (logged in via Supabase Auth) can insert/update according to the new policy.
- **Service role** is unchanged (it bypasses RLS and is for backend use only).

## Impact on the dashboard

The **Data Admin** page currently uses the **anon** key to upsert into `cholera_reports`. After this migration:

1. **Upserts from Data Admin will fail** until the app uses an **authenticated** session.
2. To restore admin writes, do one of the following:
   - **Recommended:** Add **Supabase Auth** to the app, protect the Data Admin route so only logged-in users can open it, and use the same Supabase client (it will send the user’s JWT so inserts are allowed).
   - **Alternative:** Perform admin upserts from a **backend** that uses the **service_role** key (never expose service_role in the frontend).

## How to run the migration

1. Open **Supabase Dashboard** → **SQL Editor**.
2. Copy the contents of `migrations/20250210000000_fix_cholera_reports_rls_insert.sql`.
3. Run it.

If you use the Supabase CLI: `supabase db push` (or apply the migration as you normally do).

## Optional: allow UPDATE only for authenticated users

If your scanner also reports an overly permissive **UPDATE** policy on `cholera_reports`, uncomment the UPDATE block in the same migration file and run it again (or run the commented section in the SQL Editor).
