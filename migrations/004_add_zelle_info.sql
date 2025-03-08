-- Add zelle_info column to parties table
ALTER TABLE parties ADD COLUMN zelle_info TEXT NOT NULL DEFAULT '';

