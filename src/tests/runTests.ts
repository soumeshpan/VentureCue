declare const process: any;

import { runHumanReviewTests } from './humanReview.test';
import { runResponsibleAITests } from './responsibleAI.test';
import { runProgressAnalyticsTests } from './progressAnalytics.test';
import { runE2EIntegrationTests } from './e2eIntegration.test';
import { runPrompt11ConversationTests } from './prompt11Conversation.test';

console.log('\n========================================================');
console.log('VENTURECUE — HUMAN REVIEW & AUDIT TRAIL TEST RUN');
console.log('========================================================\n');

const hrRes = runHumanReviewTests();
hrRes.results.forEach((r) => console.log(r));

console.log('\n========================================================');
console.log('VENTURECUE — RESPONSIBLE AI, SAFETY & TRUST TEST RUN');
console.log('========================================================\n');

const raiRes = runResponsibleAITests();
raiRes.results.forEach((r) => console.log(r));

console.log('\n========================================================');
console.log('VENTURECUE — PROGRESS, ANALYTICS & WEAKNESSES TEST RUN');
console.log('========================================================\n');

const progRes = runProgressAnalyticsTests();
progRes.results.forEach((r) => console.log(r));

console.log('\n========================================================');
console.log('VENTURECUE — END-TO-END INTEGRATION & UX POLISH TEST RUN');
console.log('========================================================\n');

const e2eRes = runE2EIntegrationTests();
e2eRes.results.forEach((r) => console.log(r));

console.log('\n========================================================');
console.log('VENTURECUE — PROMPT 11: NATURAL CONVERSATION & CONTEXT ISOLATION');
console.log('========================================================\n');

const p11Res = runPrompt11ConversationTests();
p11Res.results.forEach((r) => console.log(r));

const allPassed = hrRes.passed && raiRes.passed && progRes.passed && e2eRes.passed && p11Res.passed;
const totalCount = hrRes.results.length + raiRes.results.length + progRes.results.length + e2eRes.results.length + p11Res.results.length;

console.log('\n--------------------------------------------------------');
console.log(`TOTAL RESULT: ${allPassed ? `ALL ${totalCount} TESTS PASSED ✓` : 'TESTS FAILED ✗'}`);
console.log('--------------------------------------------------------\n');

if (!allPassed) {
  process.exit(1);
}

