-- Run this in your Supabase SQL editor
-- Creates the Proposals table for client-specific, customizable proposals

create table if not exists public."Proposals" (
  "Proposal_ID"               bigserial primary key,
  "user_id"                   uuid references auth.users(id) on delete cascade not null,
  "Contact_ID"                bigint references public."Contacts"("Contact_ID") on delete cascade,
  "Inquiry_ID"                bigint references public."Inquiries"("Inquiry_ID") on delete set null,
  "Title"                     text not null default 'Wedding Proposal',
  "Status"                    text not null default 'Draft', -- Draft | Sent | Accepted | Declined
  "Package_ID"                bigint references public."Packages"("Package_ID") on delete set null,
  "Addons"                    jsonb not null default '[]',
  "Cover_Image"               text,
  "Custom_Notes"              text,
  "Questionnaire_Template_ID" bigint,
  "Contract_Template_ID"      bigint,
  "Sent_At"                   timestamptz,
  "Accepted_At"               timestamptz,
  "Declined_At"               timestamptz,
  "Decline_Reason"            text,
  "Created_At"                timestamptz not null default now(),
  "Updated_At"                timestamptz not null default now()
);

-- Enable RLS
alter table public."Proposals" enable row level security;

-- Owner can do everything
create policy "Proposals: owner full access"
  on public."Proposals" for all
  using (auth.uid() = "user_id");

-- Public can read proposals (needed for the /proposal/[id] page)
create policy "Proposals: public read"
  on public."Proposals" for select
  using (true);

-- Update trigger to keep Updated_At current
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new."Updated_At" = now();
  return new;
end;
$$;

create trigger proposals_updated_at
  before update on public."Proposals"
  for each row execute function update_updated_at_column();
