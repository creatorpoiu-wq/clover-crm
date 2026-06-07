-- Marketing Popups Table
CREATE TABLE IF NOT EXISTS public."Marketing_Popups" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "internal_name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "button_text" TEXT DEFAULT 'Subscribe',
    "button_color" TEXT DEFAULT '#3b82f6',
    "delay_seconds" INTEGER DEFAULT 3,
    "active" BOOLEAN DEFAULT true,
    "view_count" INTEGER DEFAULT 0,
    "conversion_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Marketing_Popups" ENABLE ROW LEVEL SECURITY;

-- Policies for Marketing_Popups
CREATE POLICY "Users can view their own popups" 
ON public."Marketing_Popups" FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own popups" 
ON public."Marketing_Popups" FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own popups" 
ON public."Marketing_Popups" FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own popups" 
ON public."Marketing_Popups" FOR DELETE 
USING (auth.uid() = user_id);

-- Allow public to select popups for widget rendering (we actually bypass this with Service Role, but if public anon reads it:
CREATE POLICY "Public can view active popups"
ON public."Marketing_Popups" FOR SELECT
USING (active = true);
