
-- Add creator_id and creator_name columns to the invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- Grant permissions to access these columns
GRANT SELECT, INSERT, UPDATE (creator_id, creator_name) ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE (creator_id, creator_name) ON invoices TO service_role;

-- If possible, backfill existing data with the current user info
-- This is done via an application update, not in this SQL
