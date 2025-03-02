-- Create the parties table
CREATE TABLE IF NOT EXISTS public.parties (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organizations TEXT[] NOT NULL,
  max_capacity INTEGER NOT NULL,
  allow_waitlist BOOLEAN NOT NULL DEFAULT true,
  tier1_price NUMERIC NOT NULL,
  tier2_price NUMERIC NOT NULL,
  tier3_price NUMERIC NOT NULL,
  tier1_capacity INTEGER NOT NULL,
  tier2_capacity INTEGER NOT NULL,
  venmo_username TEXT NOT NULL,
  admin_username TEXT NOT NULL,
  admin_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations" ON public.parties
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Function to create a new party registration table
CREATE OR REPLACE FUNCTION create_party_registration_table(party_slug TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.registrations_%s (
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
      qr_code TEXT
    )', party_slug);
    
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_registrations_%s_andrew_id ON public.registrations_%s(andrew_id)', 
    party_slug, party_slug);
    
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_registrations_%s_status ON public.registrations_%s(status)', 
    party_slug, party_slug);
    
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_registrations_%s_organization ON public.registrations_%s(organization)', 
    party_slug, party_slug);
    
  EXECUTE format('
    ALTER TABLE public.registrations_%s ENABLE ROW LEVEL SECURITY', 
    party_slug);
    
  EXECUTE format('
    CREATE POLICY "Allow all operations" ON public.registrations_%s
      FOR ALL
      TO authenticated, anon
      USING (true)
      WITH CHECK (true)', 
    party_slug);
    
  EXECUTE format('
    GRANT ALL ON public.registrations_%s TO anon, authenticated', 
    party_slug);
    
  EXECUTE format('
    GRANT USAGE, SELECT ON SEQUENCE registrations_%s_id_seq TO anon, authenticated', 
    party_slug);
END;
$$;

-- Grant permissions
GRANT ALL ON public.parties TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE parties_id_seq TO anon, authenticated;

