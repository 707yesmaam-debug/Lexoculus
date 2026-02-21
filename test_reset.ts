import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceRole) {
    console.error("No SUPABASE_SERVICE_ROLE_KEY found in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function test() {
    const email = 'yc@lexoculus.com';
    console.log('Generating link for', email);
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
            redirectTo: 'http://localhost:3000/auth/update-password',
        }
    });

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Action Link:', data.properties?.action_link);
    }
}

test();
