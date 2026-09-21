import 'fake-indexeddb/auto';
import {
  saveQuizAttempt,
  getQuizAttempt,
  saveQuizSubmission,
  getQuizSubmission,
  saveOfflineDoubt,
  getDoubtsForLecture,
  getAllPendingAttempts,
  getAllPendingSubmissions,
  getAllPendingDoubts,
  markQuizAttemptsAsSynced,
  markQuizSubmissionsAsSynced,
  markDoubtsAsSynced,
  getPendingSyncCount,
} from './src/utils/indexedDB.js';

async function runEndToEndOfflineMicroSyncSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END OFFLINE + MICROSYNC TEST');
  console.log('================================================================');

  const lectureId = 'lec_math10_quad_01';
  const quizId = 'quiz_lec_math10_quad_01';

  // --- Step 1: Initial State Check ---
  console.log('\n[Phase 1: Initial Pending Count Check]');
  let initialCount = await getPendingSyncCount();
  console.log(`✓ Initial pending sync count: ${initialCount}`);

  // --- Step 2: Student asks a timestamped doubt (Simulating Offline) ---
  console.log('\n[Phase 2: Offline Timestamped Doubt Creation]');
  const doubt1 = await saveOfflineDoubt({
    lectureId,
    timestamp: '18:42',
    text: 'Why does the quadratic formula require ± in front of the square root?',
  });
  console.log('✓ Saved timestamped doubt:', doubt1);
  if (doubt1.status !== 'pending') throw new Error('Doubt status must be pending');
  if (doubt1.timestamp !== '18:42') throw new Error('Doubt timestamp mismatch');

  let countAfterDoubt = await getPendingSyncCount();
  console.log(`✓ Pending sync count after 1 doubt: ${countAfterDoubt}`);
  if (countAfterDoubt !== initialCount + 1) throw new Error('Pending count should increase by 1');

  // --- Step 3: Student takes lecture-specific offline quiz ---
  console.log('\n[Phase 3: Student Offline Quiz Answering]');
  // Answer question 1
  await saveQuizAttempt({
    quizId,
    lectureId,
    questionId: 'q1',
    selectedAnswer: 'B',
    correctAnswer: 'B',
    score: 1,
  });

  // Answer question 2
  await saveQuizAttempt({
    quizId,
    lectureId,
    questionId: 'q2',
    selectedAnswer: 'A',
    correctAnswer: 'A',
    score: 1,
  });

  // Complete submission
  const submissionData = {
    quizId,
    lectureId,
    score: 4,
    totalQuestions: 5,
    correctCount: 4,
    wrongCount: 1,
    answersMap: { q1: 'B', q2: 'A', q3: 'A', q4: 'B', q5: 'C' },
  };

  const savedSub = await saveQuizSubmission(submissionData);
  console.log('✓ Saved quiz submission:', savedSub);
  if (savedSub.status !== 'pending') throw new Error('Quiz submission must be pending');
  if (savedSub.score !== 4) throw new Error('Quiz score mismatch');

  let countAfterQuiz = await getPendingSyncCount();
  console.log(`✓ Pending sync count after Doubt + Quiz: ${countAfterQuiz}`);
  if (countAfterQuiz !== initialCount + 2) throw new Error('Pending count should be initial + 2 (1 quiz + 1 doubt)');

  // --- Step 4: Refresh / Local Persistence Verification ---
  console.log('\n[Phase 4: Persistence Verification (Simulating Browser Refresh Offline)]');
  const retrievedDoubts = await getDoubtsForLecture(lectureId);
  console.log(`✓ Retrieved doubts count for ${lectureId}: ${retrievedDoubts.length}`);
  const foundDoubt = retrievedDoubts.find((d) => d.doubtId === doubt1.doubtId);
  if (!foundDoubt) throw new Error('Doubt record lost after simulated refresh');
  if (foundDoubt.text !== doubt1.text) throw new Error('Doubt text corrupted');

  const retrievedSub = await getQuizSubmission(quizId, lectureId);
  if (!retrievedSub) throw new Error('Quiz submission lost after simulated refresh');
  if (retrievedSub.score !== 4) throw new Error('Quiz score lost after refresh');
  if (retrievedSub.answersMap.q1 !== 'B') throw new Error('Answers map corrupted');
  console.log('✓ Quiz and Doubt records remain fully intact across simulated refresh!');

  // --- Step 5: MicroSync Execution ---
  console.log('\n[Phase 5: MicroSync Execution to Server API]');
  const pendingSubs = await getAllPendingSubmissions();
  const pendingDoubts = await getAllPendingDoubts();

  console.log(`  Submissions to sync: ${pendingSubs.length}`);
  console.log(`  Doubts to sync: ${pendingDoubts.length}`);

  const syncPayload = {
    quizzes: pendingSubs,
    doubts: pendingDoubts,
  };

  const syncResponse = await fetch('http://localhost:5000/api/sync/microsync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(syncPayload),
  });

  const syncResult = await syncResponse.json();
  console.log('✓ Server MicroSync response:', syncResult);
  if (!syncResult.success) throw new Error('MicroSync failed on server');

  // --- Step 6: Mark Local Records as Synced without Deleting ---
  console.log('\n[Phase 6: Update Local Status to Synced (Preservation Check)]');
  const pendingAttempts = await getAllPendingAttempts();
  await markQuizSubmissionsAsSynced(pendingSubs.map((q) => ({ quizId: q.quizId, lectureId: q.lectureId })));
  await markQuizAttemptsAsSynced(pendingAttempts.map((a) => ({ quizId: a.quizId, questionId: a.questionId })));
  await markDoubtsAsSynced(pendingDoubts.map((d) => d.doubtId));

  // --- Step 7: Confirm Pending Count Becomes 0 ---
  console.log('\n[Phase 7: Confirm Pending Sync Count Becomes 0]');
  const finalPendingCount = await getPendingSyncCount();
  console.log(`✓ Final pending sync count: ${finalPendingCount}`);
  if (finalPendingCount !== 0) throw new Error(`Expected pending count 0, but got ${finalPendingCount}`);

  // --- Step 8: Confirm Synced Records Still Exist Locally ---
  console.log('\n[Phase 8: Confirm Synced Records Remain Locally]');
  const localDoubtsAfterSync = await getDoubtsForLecture(lectureId);
  const syncedDoubtRecord = localDoubtsAfterSync.find((d) => d.doubtId === doubt1.doubtId);
  if (!syncedDoubtRecord) throw new Error('Synced doubt was deleted from local storage!');
  if (syncedDoubtRecord.status !== 'synced') throw new Error('Doubt status not updated to synced');

  const localSubAfterSync = await getQuizSubmission(quizId, lectureId);
  if (!localSubAfterSync) throw new Error('Synced quiz was deleted from local storage!');
  if (localSubAfterSync.status !== 'synced') throw new Error('Quiz status not updated to synced');
  console.log('✓ Confirmed: Synced quiz and doubts remain stored locally in IndexedDB with status = "synced"!');

  console.log('\n================================================================');
  console.log('🏆 ALL E2E OFFLINE & MICROSYNC VERIFICATION CHECKS PASSED! 🏆');
  console.log('================================================================');
}

runEndToEndOfflineMicroSyncSuite().catch((err) => {
  console.error('❌ E2E Test Suite Error:', err);
  process.exit(1);
});
