-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the parties table
CREATE TABLE IF NOT EXISTS public.parties (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organizations TEXT[] NOT NULL,
  max_capacity INTEGER NOT NULL,
  allow_waitlist BOOLEAN NOT NULL DEFAULT true,
  ticket_price NUMERIC NOT NULL,
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

-- Create the price_tiers table
CREATE TABLE IF NOT EXISTS public.price_tiers (
  id SERIAL PRIMARY KEY,
  party_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(party_slug, name)
);

-- Enable Row Level Security
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations" ON public.price_tiers
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Function to create a new party registration table
CREATE OR REPLACE FUNCTION public.create_party_registration_table(party_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This ensures the function runs with the privileges of the owner
SET search_path = public -- This ensures the function only accesses the public schema
AS $$
BEGIN
  -- Create the registrations table
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
      tier_price NUMERIC
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

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.create_party_registration_table(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_party_registration_table(TEXT) TO anon;

-- Grant permissions for the parties table
GRANT ALL ON public.parties TO authenticated;
GRANT ALL ON public.parties TO anon;
GRANT USAGE, SELECT ON SEQUENCE parties_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE parties_id_seq TO anon;

-- Grant permissions
GRANT ALL ON public.price_tiers TO authenticated;
GRANT ALL ON public.price_tiers TO anon;
GRANT USAGE, SELECT ON SEQUENCE price_tiers_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE price_tiers_id_seq TO anon;

