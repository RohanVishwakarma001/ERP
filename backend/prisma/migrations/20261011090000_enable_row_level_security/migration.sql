-- Row Level Security: deny-by-default for every database role except the one the
-- API runs as.
--
-- The API connects as a single role and enforces per-user authorization in the
-- service layer (guards, ownership checks, scoped queries). RLS is the backstop
-- underneath that: any *other* role — a leaked read-only credential, a BI tool,
-- Neon's Data API `anonymous`/`authenticated` roles — sees no rows at all.
--
-- The table owner bypasses RLS (we do not FORCE it), so if the API runs as the
-- role that applies migrations, nothing changes for it. The explicit policy below
-- additionally covers the case where migrations run as that same non-owner role.
-- If the API uses a DIFFERENT role than the one running this migration, grant it
-- access with:  CREATE POLICY api_full_access ON "<Table>" TO <api_role> USING (true) WITH CHECK (true);

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS api_full_access ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY api_full_access ON public.%I TO %I USING (true) WITH CHECK (true)',
      t.tablename, current_user
    );
  END LOOP;
END
$$;

-- Nothing in this schema is meant to be reachable by roles that were not granted it explicitly.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
