CREATE TABLE IF NOT EXISTS public."Contact_Documents" (
    "Document_ID" SERIAL PRIMARY KEY,
    "user_id" UUID REFERENCES auth.users NOT NULL,
    "Contact_ID" INTEGER REFERENCES public."Contacts"("Contact_ID") ON DELETE CASCADE,
    "Title" TEXT NOT NULL,
    "Type" TEXT NOT NULL, -- 'Invoice' or 'Contract'
    "File_Type" TEXT NOT NULL,
    "File_Data" TEXT NOT NULL, -- Base64 string
    "Upload_Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public."Contact_Documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contact documents" 
ON public."Contact_Documents" 
FOR ALL USING (auth.uid() = user_id);
