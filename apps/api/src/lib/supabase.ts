import {createClient} from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if(!SUPABASE_URL){
    throw new Error("Missing Supabase url environment variable");
}
console.log(SUPABASE_SERVICE_ROLE_KEY);
if(!SUPABASE_SERVICE_ROLE_KEY){
    throw new Error("Missing supabase service role key environment variable");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});