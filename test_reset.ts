import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Testing Supabase recovery link generation");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRole) {
        console.error("Missing Supabase keys");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = 'varad.kh17@gmail.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
            redirectTo: `${appUrl}/auth/update-password`,
        }
    });

    console.log("Error:", error?.message);
    console.log("Action Link:", data?.properties?.action_link);
}
test().catch(console.error);
