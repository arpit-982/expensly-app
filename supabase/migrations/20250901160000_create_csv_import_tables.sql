-- Create CSV uploads tracking table
CREATE TABLE public.csv_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  original_file_name text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'staged', 'approved', 'rejected')),
  total_transactions integer NOT NULL DEFAULT 0,
  pending_count integer NOT NULL DEFAULT 0,
  auto_tagged_count integer NOT NULL DEFAULT 0,
  manually_tagged_count integer NOT NULL DEFAULT 0,
  reviewed_count integer NOT NULL DEFAULT 0,
  created_by text, -- Could be user ID in future
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create staged transactions table
CREATE TABLE public.staged_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_upload_id uuid NOT NULL REFERENCES csv_uploads(id) ON DELETE CASCADE,
  row_index integer NOT NULL, -- Original row number in CSV
  
  -- Original CSV data
  original_date text NOT NULL,
  original_amount text NOT NULL,
  original_description text NOT NULL,
  original_data jsonb NOT NULL, -- Store all CSV columns
  
  -- Parsed/normalized data
  parsed_date date,
  parsed_amount numeric,
  parsed_description text,
  currency text DEFAULT 'INR',
  
  -- Manual tagging fields
  account text,
  counter_account text,
  tags text[] DEFAULT '{}',
  narration text,
  
  -- LLM suggestions
  suggested_account text,
  suggested_counter_account text,
  suggested_tags text[] DEFAULT '{}',
  suggested_narration text,
  
  -- State tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auto-tagged', 'manually-tagged', 'reviewed', 'approved')),
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Metadata
  fingerprint text, -- For similarity matching
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(csv_upload_id, row_index)
);

-- Create indexes for performance
CREATE INDEX idx_csv_uploads_status ON csv_uploads(status);
CREATE INDEX idx_csv_uploads_uploaded_at ON csv_uploads(uploaded_at DESC);
CREATE INDEX idx_staged_transactions_csv_upload_id ON staged_transactions(csv_upload_id);
CREATE INDEX idx_staged_transactions_status ON staged_transactions(status);
CREATE INDEX idx_staged_transactions_fingerprint ON staged_transactions(fingerprint);

-- Create function to update csv_uploads counts when staged_transactions change
CREATE OR REPLACE FUNCTION update_csv_upload_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for the affected csv_upload
  UPDATE csv_uploads 
  SET 
    total_transactions = (
      SELECT COUNT(*) 
      FROM staged_transactions 
      WHERE csv_upload_id = COALESCE(NEW.csv_upload_id, OLD.csv_upload_id)
    ),
    pending_count = (
      SELECT COUNT(*) 
      FROM staged_transactions 
      WHERE csv_upload_id = COALESCE(NEW.csv_upload_id, OLD.csv_upload_id) 
      AND status = 'pending'
    ),
    auto_tagged_count = (
      SELECT COUNT(*) 
      FROM staged_transactions 
      WHERE csv_upload_id = COALESCE(NEW.csv_upload_id, OLD.csv_upload_id) 
      AND status = 'auto-tagged'
    ),
    manually_tagged_count = (
      SELECT COUNT(*) 
      FROM staged_transactions 
      WHERE csv_upload_id = COALESCE(NEW.csv_upload_id, OLD.csv_upload_id) 
      AND status = 'manually-tagged'
    ),
    reviewed_count = (
      SELECT COUNT(*) 
      FROM staged_transactions 
      WHERE csv_upload_id = COALESCE(NEW.csv_upload_id, OLD.csv_upload_id) 
      AND status IN ('reviewed', 'approved')
    )
  WHERE id = COALESCE(NEW.csv_upload_id, OLD.csv_upload_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update counts
CREATE TRIGGER trigger_update_csv_upload_counts
  AFTER INSERT OR UPDATE OR DELETE ON staged_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_csv_upload_counts();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on staged_transactions
CREATE TRIGGER trigger_staged_transactions_updated_at
  BEFORE UPDATE ON staged_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
