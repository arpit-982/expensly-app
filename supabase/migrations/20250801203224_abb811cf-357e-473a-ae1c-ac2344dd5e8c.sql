-- Create policy to allow all operations on ledger_files table
CREATE POLICY "Allow all operations on ledger_files" 
ON public.ledger_files 
FOR ALL 
USING (true)
WITH CHECK (true);