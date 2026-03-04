import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();
const SRC_LIB = path.join(ROOT_DIR, 'src', 'lib');

const moves = {
    // infra
    "prisma.ts": "infra/prisma.ts",
    "supabase.ts": "infra/supabase.ts",
    "supabase-server.ts": "infra/supabase-server.ts",
    "storage.ts": "infra/storage.ts",
    "logger.ts": "infra/logger.ts",
    // output
    "pdf-generator.ts": "output/pdf-generator.ts",
    "document-generator.ts": "output/document-generator.ts",
    "report-signer.ts": "output/report-signer.ts",
    "document-templates": "output/document-templates",
    // platform
    "subscription.ts": "platform/subscription.ts",
    "admin.ts": "platform/admin.ts",
    "pricing-config.ts": "platform/pricing-config.ts",
    "users.ts": "platform/users.ts",
    "email.ts": "platform/email.ts",
    "dodo.ts": "platform/dodo.ts",
    // security
    "tripwire.ts": "security/tripwire.ts",
    "guardian-agent.ts": "security/guardian-agent.ts",
    "audit-logger.ts": "security/audit-logger.ts",
    "encryption.ts": "security/encryption.ts",
    "rateLimit.ts": "security/rateLimit.ts",
    // github
    "github.ts": "github/github.ts",
    "github-security.ts": "github/github-security.ts",
    // analysis
    "groq.ts": "analysis/groq.ts",
    "dependency-scanner.ts": "analysis/dependency-scanner.ts",
    "ai-library-database.ts": "analysis/ai-library-database.ts",
    // compliance/eu-ai-act
    "annex-iii-articles.ts": "compliance/eu-ai-act/annex-iii-articles.ts",
    "constraint-engine.ts": "compliance/eu-ai-act/constraint-engine.ts",
    "risk-classifier.ts": "compliance/eu-ai-act/risk-classifier.ts",
    "conformity-assessment.ts": "compliance/eu-ai-act/conformity-assessment.ts",
    "gpai-classifier.ts": "compliance/eu-ai-act/gpai-classifier.ts",
    "context-questions.ts": "compliance/eu-ai-act/context-questions.ts",
    "context-refiner.ts": "compliance/eu-ai-act/context-refiner.ts",
    "compliance-timeline.ts": "compliance/eu-ai-act/compliance-timeline.ts",
    "purpose-categories.ts": "compliance/eu-ai-act/purpose-categories.ts",
    "risk-evidence.ts": "compliance/eu-ai-act/risk-evidence.ts"
};

// 1. Create directories
console.log("Creating directories...");
const dirs = new Set(Object.values(moves).map(p => path.dirname(path.join(SRC_LIB, p))));
for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 2. Move files
console.log("Moving files...");
for (const [oldName, newPath] of Object.entries(moves)) {
    const oldFullPath = path.join(SRC_LIB, oldName);
    const newFullPath = path.join(SRC_LIB, newPath);
    if (fs.existsSync(oldFullPath)) {
        fs.renameSync(oldFullPath, newFullPath);
        console.log(`Moved ${oldName} -> ${newPath}`);
    }
}

// 3. Move root scripts to `scripts/`
const scriptsToMove = [
    "check_local_secret.ts", "debug_env.ts", "generate_correct_secret.ts",
    "simulate_webhook.ts", "test_api.js", "test_email.ts", "test_reset.ts", "verify_scan_result.ts"
];
if (!fs.existsSync(path.join(ROOT_DIR, 'scripts'))) fs.mkdirSync(path.join(ROOT_DIR, 'scripts'));
for (const script of scriptsToMove) {
    const p = path.join(ROOT_DIR, script);
    if (fs.existsSync(p)) {
        fs.renameSync(p, path.join(ROOT_DIR, 'scripts', script));
        console.log(`Moved root script ${script} -> scripts/`);
    }
}

// Build map for simple `@/lib/X` replacements
const externalMap = {};
for (const [oldName, newPath] of Object.entries(moves)) {
    if (oldName.includes('.')) {
        const baseName = oldName.replace('.ts', '');
        externalMap[baseName] = newPath.replace('.ts', '');
    }
}

function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Rule 1: External imports `@/lib/X`
            for (const [oldName, newExtPath] of Object.entries(externalMap)) {
                // match from '@/lib/something' or "@/lib/something"
                // Needs regex with boundry to avoid matching "xyz-something" when looking for "something"
                const regex = new RegExp(`(['"\`])@/lib/${oldName}(['"\`])`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `$1@/lib/${newExtPath}$2`);
                    modified = true;
                }
            }

            // Rule 2: Test specific imports `../../src/lib/X`
            for (const [oldName, newExtPath] of Object.entries(externalMap)) {
                const regex = new RegExp(`(['"\`])\\.\\./\\.\\./src/lib/${oldName}(['"\`])`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `$1../../src/lib/${newExtPath}$2`);
                    modified = true;
                }
            }

            // Rule 3: Specific internal lib cross-domain imports
            const normalizedPath = fullPath.replace(/\\/g, '/');
            if (normalizedPath.includes('src/lib/compliance/eu-ai-act/risk-classifier.ts')) {
                content = content.replace(/(['"`])\.\/ai-library-database(['"`])/g, "$1../../analysis/ai-library-database$2");
                modified = true;
            }
            if (normalizedPath.includes('src/lib/security/tripwire.ts') || normalizedPath.includes('src/lib/security/guardian-agent.ts')) {
                content = content.replace(/(['"`])\.\/annex-iii-articles(['"`])/g, "$1../compliance/eu-ai-act/annex-iii-articles$2");
                modified = true;
            }
            if (normalizedPath.includes('src/lib/security/audit-logger.ts') || normalizedPath.includes('src/lib/platform/subscription.ts') || normalizedPath.includes('src/lib/platform/users.ts')) {
                content = content.replace(/(['"`])\.\/prisma(['"`])/g, "$1../infra/prisma$2");
                modified = true;
            }
            if (normalizedPath.includes('src/lib/platform/subscription.ts') || normalizedPath.includes('src/lib/platform/admin.ts') || normalizedPath.includes('src/lib/platform/email.ts')) {
                content = content.replace(/(['"`])\.\/logger(['"`])/g, "$1../infra/logger$2");
                modified = true;
            }
            if (normalizedPath.includes('src/lib/platform/admin.ts')) {
                content = content.replace(/(['"`])\.\/supabase-server(['"`])/g, "$1../infra/supabase-server$2");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated imports in ${fullPath}`);
            }
        }
    }
}

console.log("Updating external and internal imports...");
processDirectory(path.join(ROOT_DIR, 'src'));
processDirectory(path.join(ROOT_DIR, '__tests__'));

console.log("Refactoring complete.");
