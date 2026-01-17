console.error('Script starting...');
import { config } from 'dotenv';
import path from 'path';
// Load .env.local BEFORE any other imports
config({ path: path.resolve(process.cwd(), '.env.local') });

// Debug env
console.error('ENV CHECK:');
console.error('Current working directory:', process.cwd());
console.error('DATABASE_URL present:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.error('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 10) + '...');
} else {
    console.error('CRITICAL: DATABASE_URL is MISSING from process.env');
}

async function main() {
    // Dynamic imports to prevent hoisting issues
    const { PrismaClient } = await import('@prisma/client');
    const { scanPublicRepository } = await import('../src/lib/github-public');
    const { analyzeRepository } = await import('../src/lib/groq');
    const { classifyRiskWithConstraintValidation } = await import('../src/lib/risk-classifier');

    const rawUrl = process.env.DATABASE_URL || '';
    const cleanUrl = rawUrl.replace(/\s/g, '');

    // Update process.env so Prisma picks it up automatically
    process.env.DATABASE_URL = cleanUrl;
    console.error('Updated process.env.DATABASE_URL (length):', process.env.DATABASE_URL.length);

    const prisma = new PrismaClient();

    // Check if we can connect to DB
    try {
        await prisma.$connect();
        console.log('✅ Connected to Database');
    } catch (e) {
        console.error('❌ Database connection failed:', e);
        return;
    }

    const repoUrl = 'https://github.com/ksm26/Multi-AI-Agent-Systems-with-crewAI';
    console.log(`🚀 Starting reproduction for: ${repoUrl}`);

    // 1. Get a user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('❌ No user found in database. Cannot proceed.');
        return;
    }
    console.log(`👤 Using user: ${user.email} (${user.id})`);

    try {
        // 2. Scan Public Repository
        console.log('\n--- STEP 1: SCANNING REPO ---');
        const [owner, repo] = ['ksm26', 'Multi-AI-Agent-Systems-with-crewAI'];
        const scanData = await scanPublicRepository(owner, repo);
        console.log(`✅ Scan successful! Found ${scanData.total_files} files.`);

        // Save scan to DB
        const repoScan = await prisma.repoScan.create({
            data: {
                user_id: user.id,
                github_repo_url: repoUrl,
                repo_owner: scanData.repo_owner,
                repo_name: scanData.repo_name,
                repo_description: scanData.repo_description,
                readme_content: scanData.readme_content,
                package_json_content: scanData.package_json_content ?? undefined,
                requirements_txt_content: scanData.requirements_txt_content,
                pyproject_toml_content: scanData.pyproject_toml_content ?? undefined,
                file_tree: scanData.file_tree,
                total_files: scanData.total_files,
                primary_language: scanData.primary_language,
                license_type: scanData.license_type,
                stars_count: scanData.stars_count || 0,
                forks_count: scanData.forks_count || 0,
                watchers_count: scanData.watchers_count || 0,
            },
        });
        console.log(`💾 Saved RepoScan ID: ${repoScan.id}`);

        // 3. Analyze Capabilities (Groq)
        console.log('\n--- STEP 2: ANALYZING CAPABILITIES ---');
        // Check if GROQ_API_KEY is present
        if (!process.env.GROQ_API_KEY) {
            console.warn('⚠️ GROQ_API_KEY is missing via process.env. Checking logic...');
        }

        const groqResponse = await analyzeRepository(repoScan);
        console.log('✅ Analysis complete!');
        console.log('Is AI System:', groqResponse.analysis.is_ai_system);
        console.log('Model Used:', groqResponse.model);

        // Save Analysis to DB
        const analysis = await prisma.llmCapabilityAnalysis.create({
            data: {
                repo_scan_id: repoScan.id,
                user_id: user.id,
                is_ai_system: groqResponse.analysis.is_ai_system,
                capabilities: groqResponse.analysis.capabilities,
                libraries: groqResponse.analysis.libraries,
                ai_frameworks: groqResponse.analysis.ai_frameworks,
                programming_languages: groqResponse.analysis.programming_languages,
                detected_model_types: groqResponse.analysis.detected_model_types,
                has_ml_pipeline: groqResponse.analysis.has_ml_pipeline,
                has_training_code: groqResponse.analysis.has_training_code,
                has_inference_code: groqResponse.analysis.has_inference_code,
                has_data_processing: groqResponse.analysis.has_data_processing,
                has_model_serialization: groqResponse.analysis.has_model_serialization,
                estimated_risk_indicators: groqResponse.analysis.estimated_risk_indicators,
                llm_model_used: groqResponse.model,
                analysis_duration_ms: groqResponse.duration_ms,
                confidence_score: groqResponse.confidence_score,
                analysis_notes: groqResponse.analysis.reasoning,
            },
        });
        console.log(`💾 Saved Analysis ID: ${analysis.id}`);

        // 4. Classify Risk
        console.log('\n--- STEP 3: CLASSIFYING RISK ---');

        // Re-fetch analysis with repo_scan included as expected by type (mimic prisma include)
        const analysisWithRepo = await prisma.llmCapabilityAnalysis.findUnique({
            where: { id: analysis.id },
            include: {
                repo_scan: {
                    select: {
                        repo_name: true,
                        repo_owner: true,
                    },
                },
            },
        });

        if (!analysisWithRepo) throw new Error('Failed to fetch analysis for classification');

        const result = classifyRiskWithConstraintValidation(analysisWithRepo);

        console.log(`✅ Classification: ${result.risk_classification}`);
        console.log(`   Score: ${result.risk_score}`);
        console.log(`   Matched Articles: ${result.matched_annex_iii_articles.length}`);
        console.log(`   Key Findings: ${result.key_findings.length}`);

        if (result.constraint_validation?.was_overridden) {
            console.log(`   ⚠️ CONSTRAINT OVERRIDE: ${result.constraint_validation.override_reason}`);
        }

    } catch (error) {
        console.error('\n❌ ERROR OCCURRED:');
        console.error(error);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
