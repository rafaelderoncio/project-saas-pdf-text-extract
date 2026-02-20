DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scanflowread') THEN
    CREATE ROLE scanflowread WITH REPLICATION LOGIN PASSWORD 'scanflowread';
  END IF;
END
$$;
