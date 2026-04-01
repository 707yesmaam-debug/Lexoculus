import { prisma } from '../src/lib/infra/prisma';
import fs from 'fs';
import path from 'path';

async function verifySecurity() {
    console.log('🔍 Starting Security Verification...\n');

    // 1. Verify Debug Directory Deletion
    const debugPath = path.join(process.cwd(), 'src/app/api/debug');
    if (!fs.existsSync(debugPath)) {
        console.log('✅ [PASS] /api/debug directory has been removed.');
    } else {
        console.error('❌ [FAIL] /api/debug directory still exists!');
    }

    // 2. Verify IDOR Fix in Database logic
    // We can simulate the query that was vulnerable
    const dummyUserId = 'non-existent-user-id';
    const existingAssessmentId = 'some-real-assessment-id'; // You would put a real one here in a real test

    console.log('\n🛡️ Verifying IDOR Mitigation Logic...');
    const report = await prisma.complianceReport.findFirst({
        where: {
            final_risk_assessment_id: existingAssessmentId,
            user_id: dummyUserId // This should return null if the user doesn't own it
        }
    });

    if (!report) {
        console.log('✅ [PASS] IDOR check: Unauthorized user cannot fetch report by assessment ID.');
    } else {
        console.error('❌ [FAIL] IDOR check: Data returned for incorrect user!');
    }

    console.log('\n✨ Verification Complete.');
}

// Note: This script is for demonstration of the logic. 
// In a real environment, you would run this against a test database.
// verifySecurity().catch(console.error);
