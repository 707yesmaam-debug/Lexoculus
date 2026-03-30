import { config } from 'dotenv';
config({ path: '.env.local' });
import prisma from '../src/lib/infra/prisma';

async function main() {
    console.log('--- Phase 5: Emotion Recognition Migration Script ---');
    console.log('Reclassifying existing LIMITED_RISK emotion recognition records to HIGH_RISK');

    // Find all assessments that are currently LIMITED_RISK
    const assessments = await prisma.riskAssessment.findMany({
        where: {
            risk_classification: 'LIMITED_RISK',
        },
    });

    console.log(`Found ${assessments.length} LIMITED_RISK assessments to scan.`);

    let updatedCount = 0;

    for (const assessment of assessments) {
        // Check if matched_annex_iii_articles or evidence indicate emotion recognition
        let hasEmotionRecognition = false;

        if (Array.isArray(assessment.matched_annex_iii_articles)) {
            hasEmotionRecognition = (assessment.matched_annex_iii_articles as any[]).some(
                (a: any) => a.category === 'Emotion Recognition' || a.article === 'Article 50(3)'
            );
        }

        if (!hasEmotionRecognition && Array.isArray(assessment.evidence)) {
            hasEmotionRecognition = (assessment.evidence as any[]).some(
                (e: any) => e.risk_indicators?.includes('uses_emotion_recognition')
            );
        }

        if (hasEmotionRecognition) {
            console.log(`Found legacy Emotion Recognition assessment (ID: ${assessment.id}). Upgrading to HIGH_RISK...`);

            // Upgrade to HIGH_RISK
            const updatedScore = Math.max(assessment.risk_score, 75); // HIGH RISK base score

            await prisma.riskAssessment.update({
                where: { id: assessment.id },
                data: {
                    risk_classification: 'HIGH_RISK',
                    risk_score: updatedScore,
                    is_limited_risk: true, // Keep transparency req
                    is_high_risk: true,
                    risk_narrative: assessment.risk_narrative + 
                        '\n\n[ADMIN PATCH]: Reclassified to HIGH_RISK due to EU AI Act emotion recognition mandate.',
                },
            });

            // Also update any FinalRiskAssessments
            const finalAssessment = await prisma.finalRiskAssessment.findUnique({
                where: { repo_scan_id: assessment.repo_scan_id },
            });

            if (finalAssessment) {
                // Determine if there is already an ESCALATION
                const newEscalationReason = finalAssessment.escalation_reason
                    ? finalAssessment.escalation_reason + ' | Emotion Recognition reclassified to High Risk'
                    : 'System capabilities involve Emotion Recognition, now strictly mapped to HIGH RISK.';

                console.log(`   -> Also upgrading FinalRiskAssessment (ID: ${finalAssessment.id}).`);
                await prisma.finalRiskAssessment.update({
                    where: { id: finalAssessment.id },
                    data: {
                        final_risk_classification: 'HIGH_RISK',
                        final_risk_score: Math.max(finalAssessment.final_risk_score, 75),
                        requires_manual_review: true, // Requires human re-verification
                        approved_for_report: false,   // Must be re-approved
                        escalation_reason: newEscalationReason,
                    },
                });
            }

            // Also update the AiSystem history
            const aiSystemScan = await prisma.aiSystemScan.findFirst({
                where: { repo_scan_id: assessment.repo_scan_id },
            });

            if (aiSystemScan) {
                await prisma.aiSystemScan.update({
                    where: { id: aiSystemScan.id },
                    data: {
                        risk_classification: 'HIGH_RISK',
                        risk_score: updatedScore,
                    },
                });

                await prisma.aiSystem.update({
                    where: { id: aiSystemScan.ai_system_id },
                    data: {
                        risk_classification: 'HIGH_RISK',
                        risk_score: updatedScore,
                    },
                });
            }

            updatedCount++;
        }
    }

    console.log(`\nMigration complete. Reclassified ${updatedCount} assessment(s) to HIGH_RISK.`);
}

main()
    .catch(e => {
        console.error('Script failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
