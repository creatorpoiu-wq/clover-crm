import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const { data, error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm?next=/dashboard/settings`
  });
  console.log("Reset password requested:", error ? error.message : "Success");
}

test();
