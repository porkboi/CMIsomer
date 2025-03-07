-- Function to add confirmation_token column to all registration tables
CREATE OR REPLACE FUNCTION add_confirmation_token_to_registration_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_record RECORD;
BEGIN
  -- Get all registration tables
  FOR table_record IN 
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'registrations_%' AND table_schema = 'public'
  LOOP
      -- Add confirmation_token column if it doesn't exist
      EXECUTE format('
          DO $$ 
          BEGIN
              BEGIN
                  ALTER TABLE %I ADD COLUMN confirmation_token TEXT;
              EXCEPTION
                  WHEN duplicate_column THEN NULL;
              END;
          END $$;
      ', table_record.table_name);
      
      -- Create index on confirmation_token
      EXECUTE format('
          CREATE INDEX IF NOT EXISTS idx_registrations_%I_confirmation_token ON %I(confirmation_token);
      ', table_record.table_name, table_record.table_name);
  END LOOP;
END;
$$;

-- Execute the function to add columns to all existing registration tables
SELECT add_confirmation_token_to_registration_tables();

-- Update the create_party_registration_table function to include the new column
CREATE OR REPLACE FUNCTION public.create_party_registration_table(party_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Create the registrations table with confirmation_token column
EXECUTE format('
  CREATE TABLE IF NOT EXISTS registrations_%I (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    andrew_id TEXT NOT NULL UNIQUE,
    age INTEGER NOT NULL,
    organization TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_confirmed TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    price NUMERIC,
    qr_code TEXT,
    tier_name TEXT,
    tier_price NUMERIC,
    confirmation_token TEXT
  )', party_slug);
  
-- Create indexes
EXECUTE format('
  CREATE INDEX IF NOT EXISTS idx_registrations_%I_andrew_id ON registrations_%I(andrew_id)', 
  party_slug, party_slug);
  
EXECUTE format('
  CREATE INDEX IF NOT EXISTS idx_registrations_%I_status ON registrations_%I(status)', 
  party_slug, party_slug);
  
EXECUTE format('
  CREATE INDEX IF NOT EXISTS idx_registrations_%I_organization ON registrations_%I(organization)', 
  party_slug, party_slug);
  
EXECUTE format('
  CREATE INDEX IF NOT EXISTS idx_registrations_%I_tier_name ON registrations_%I(tier_name)', 
  party_slug, party_slug);
  
EXECUTE format('
  CREATE INDEX IF NOT EXISTS idx_registrations_%I_confirmation_token ON registrations_%I(confirmation_token)', 
  party_slug, party_slug);
  
-- Enable RLS
EXECUTE format('
  ALTER TABLE registrations_%I ENABLE ROW LEVEL SECURITY', 
  party_slug);
  
-- Create RLS policy
EXECUTE format('
  CREATE POLICY "Allow all operations" ON registrations_%I
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true)', 
  party_slug);
  
-- Grant permissions
EXECUTE format('
  GRANT ALL ON registrations_%I TO authenticated', 
  party_slug);
  
EXECUTE format('
  GRANT ALL ON registrations_%I TO anon', 
  party_slug);
  
EXECUTE format('
  GRANT USAGE, SELECT ON SEQUENCE registrations_%I_id_seq TO authenticated', 
  party_slug);
  
EXECUTE format('
  GRANT USAGE, SELECT ON SEQUENCE registrations_%I_id_seq TO anon', 
  party_slug);
END;
$$;

