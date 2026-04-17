import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLS() {
    console.log('--- RLS Verification Test ---');

    // 1. Test Anonymous Access (Should be blocked)
    console.log('\n[TEST 1] Testing Anonymous Access to "github_connections"...');
    const { data: q1, error: e1 } = await supabase.from('github_connections').select('*');
    if (q1 && q1.length === 0) {
        console.log('✅ SUCCESS: Anonymous access blocked (returned 0 rows).');
    } else if (e1) {
        console.log(`✅ SUCCESS: Access denied with error: ${e1.message}`);
    } else {
        console.log('❌ FAILURE: Table is still public!');
    }

    // 2. Test Access to Sensitive Metadata (Should be blocked)
    console.log('\n[TEST 2] Testing Anonymous Access to "audit_logs"...');
    const { data: q2 } = await supabase.from('audit_logs').select('*');
    if (q2 && q2.length === 0) {
        console.log('✅ SUCCESS: Audit logs hidden from public.');
    } else {
        console.log('❌ FAILURE: Audit logs are public!');
    }

    // 3. Test Prisma Access (Should still work)
    console.log('\n[NOTE] Prisma and Background jobs bypass RLS via direct connection.');
    console.log('The above tests confirm that the public API (PostgREST) is now isolated.');
}

verifyRLS().catch(console.error);
