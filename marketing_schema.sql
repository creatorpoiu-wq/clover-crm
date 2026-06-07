-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public."Marketing_Campaigns" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "audience_criteria" JSONB DEFAULT '{}'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "sent_count" INTEGER DEFAULT 0,
    "open_count" INTEGER DEFAULT 0,
    "click_count" INTEGER DEFAULT 0,
    "sent_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Campaign Recipients Table (Tracking)
CREATE TABLE IF NOT EXISTS public."Marketing_Campaign_Recipients" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "campaign_id" UUID NOT NULL REFERENCES public."Marketing_Campaigns"(id) ON DELETE CASCADE,
    "contact_id" BIGINT NOT NULL REFERENCES public."Contacts"("Contact_ID") ON DELETE CASCADE,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Sent',
    "opened_at" TIMESTAMP WITH TIME ZONE,
    "clicked_at" TIMESTAMP WITH TIME ZONE,
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Marketing_Campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Marketing_Campaign_Recipients" ENABLE ROW LEVEL SECURITY;

-- Policies for Marketing_Campaigns
CREATE POLICY "Users can view their own campaigns" 
ON public."Marketing_Campaigns" FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" 
ON public."Marketing_Campaigns" FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" 
ON public."Marketing_Campaigns" FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" 
ON public."Marketing_Campaigns" FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for Marketing_Campaign_Recipients
CREATE POLICY "Users can view recipients of their campaigns" 
ON public."Marketing_Campaign_Recipients" FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public."Marketing_Campaigns" mc 
        WHERE mc.id = "Marketing_Campaign_Recipients".campaign_id AND mc.user_id = auth.uid()
    )
);

CREATE POLICY "Service Role can insert recipients" 
ON public."Marketing_Campaign_Recipients" FOR INSERT 
WITH CHECK (true); -- Service role bypasses RLS anyway

CREATE POLICY "Service Role can update recipients (tracking)" 
ON public."Marketing_Campaign_Recipients" FOR UPDATE 
USING (true);

-- Allow public to update tracking via API (actually we'll use Service Role in the API, so no public policy needed)
