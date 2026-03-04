const fs = require('fs');
const { execSync } = require('child_process');
const results = [];
const files = [
    '__tests__/unit/constraint-engine.test.ts',
    '__tests__/unit/gpai-classifier.test.ts',
    '__tests__/unit/tripwire.test.ts',
    '__tests__/unit/context-refiner.test.ts'
];
files.forEach(file => {
    try { execSync(`npx jest ${file} --json`, { stdio: 'pipe', encoding: 'utf8' }); }
    catch (e) {
        try {
            const data = JSON.parse(e.stdout);
            data.testResults.forEach(suite => {
                suite.assertionResults.filter(r => r.status === 'failed').forEach(r => {
                    results.push({ file, test: r.title, err: r.failureMessages[0].split('\n').filter(l => l.trim() && !l.includes('node:internal')).slice(0, 5).join('\n') });
                });
            });
        } catch (parseErr) { }
    }
});
fs.writeFileSync('failures.json', JSON.stringify(results, null, 2));
