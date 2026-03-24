import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const connectionString = process.env.DATABASE_URL!;

if (!supabaseUrl || !supabaseServiceRoleKey || !connectionString) {
    console.error('Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL)');
    process.exit(1);
}

// Initialize Supabase Admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Initialize Prisma
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncMetadata() {
    console.log('--- Starting User Metadata Sync ---');
    
    try {
        // Fetch all users from Prisma
        const dbUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                account_type: true,
            }
        });

        console.log(`Found ${dbUsers.length} users in Prisma database.`);

        let updatedCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const dbUser of dbUsers) {
            try {
                // Get user from Supabase Auth to check current metadata
                const { data: { user: authUser }, error: getError } = await supabase.auth.admin.getUserById(dbUser.id);

                if (getError || !authUser) {
                    console.error(`[SKIP] User ${dbUser.email} (${dbUser.id}) not found in Supabase Auth.`);
                    skipCount++;
                    continue;
                }

                const currentMetadata = authUser.user_metadata || {};
                const currentAccountType = currentMetadata.account_type;

                // Only update if metadata is missing or mismatched
                if (currentAccountType !== dbUser.account_type) {
                    console.log(`[SYNC] Updating ${dbUser.email}: ${currentAccountType || 'none'} -> ${dbUser.account_type}`);
                    
                    const { error: updateError } = await supabase.auth.admin.updateUserById(
                        dbUser.id,
                        { user_metadata: { ...currentMetadata, account_type: dbUser.account_type } }
                    );

                    if (updateError) {
                        console.error(`[ERROR] Failed to update ${dbUser.email}:`, updateError.message);
                        errorCount++;
                    } else {
                        updatedCount++;
                    }
                } else {
                    skipCount++;
                }
            } catch (userError) {
                console.error(`[ERROR] Processing user ${dbUser.email}:`, userError);
                errorCount++;
            }
        }

        console.log('\n--- Sync Complete ---');
        console.log(`Total processed: ${dbUsers.length}`);
        console.log(`Updated:         ${updatedCount}`);
        console.log(`Skipped/Match:   ${skipCount}`);
        console.log(`Errors:          ${errorCount}`);

    } catch (error) {
        console.error('Fatal error during sync:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

syncMetadata().catch(console.error);
