
-- Migration: Add recommended fields to customers and transactions
-- Description: Adds metadata fields for better customer management and transaction tracking without breaking existing data.

-- 1. Update customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_movement_at TIMESTAMPTZ;

-- 2. Update transactions table (handles both fiados and abonos)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_note TEXT,
ADD COLUMN IF NOT EXISTS parent_transaction_id UUID REFERENCES public.transactions(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
ADD COLUMN IF NOT EXISTS pending_balance NUMERIC;

-- Comment: original_amount and pending_balance are useful if we want to track 
-- partial payments specifically linked to a debt in the future.

-- 3. Create indexes for the new columns that might be used for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_last_movement ON public.customers(last_movement_at);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON public.transactions(parent_transaction_id);
