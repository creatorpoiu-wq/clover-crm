-- Enable RLS (just to be safe, though it's already enabled)
ALTER TABLE "Automations" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to manage Automations
CREATE POLICY "Enable all access for authenticated users" 
ON "Automations"
AS PERMISSIVE FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
