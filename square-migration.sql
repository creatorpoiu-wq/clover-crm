alter table public."AppConfig" 
add column if not exists "Square_App_Id" text default null,
add column if not exists "Square_Location_Id" text default null,
add column if not exists "Square_Access_Token" text default null,
add column if not exists "Enable_Paypal" boolean default true,
add column if not exists "Enable_Square" boolean default false;
