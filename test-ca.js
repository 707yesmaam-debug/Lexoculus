const fs = require('fs');
const { execSync } = require('child_process');
const results = [];
try { execSync(`npx jest __tests__/unit/conformity-assessment.test.ts --json`, { stdio: 'pipe', encoding: 'utf8' }); }
catch (e) {
    try {
        const data = JSON.parse(e.stdout);
        data.testResults.forEach(suite => {
            suite.assertionResults.filter(r => r.status === 'failed').forEach(r => {
                results.push({ test: r.title, err: r.failureMessages[0].split('\n').filter(l => l.trim() && !l.includes('node:internal')).slice(0, 5).join('\n') });
            });
        });
    } catch (parseErr) { }
}
fs.writeFileSync('ca-failures.json', JSON.stringify(results, null, 2));
