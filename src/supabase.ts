import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enhtwwjjeymjqiimjswk.supabase.co';
const supabaseKey = 'sb_publishable_sUbolIiH9zb0ltycFvvJiw_I1OMIScV';

export const supabase = createClient(supabaseUrl, supabaseKey);
