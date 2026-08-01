-- Run this in your Supabase SQL editor

-- Add Receipt_Url to Invoices table
alter table public."Invoices" add column if not exists "Receipt_Url" text default null;

-- Add Require_Receipt_Upload to Booking_Settings table
alter table public."Booking_Settings" add column if not exists "Require_Receipt_Upload" boolean default false;
