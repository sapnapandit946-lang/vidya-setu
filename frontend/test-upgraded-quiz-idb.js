import 'fake-indexeddb/auto';
import {
  saveQuizAttempt,
  getQuizAttempt,
  saveQuizSubmission,
  getQuizSubmission,
  getPendingSyncCount,
} from './src/utils/indexedDB.js';

async function testUpgradedIndexedDB() {
  console.log('--- Starting Part 3 Upgrade: Lecture-Connected Quiz IndexedDB Tests ---');

  const quizId = 'quiz_lec_math10_quad_01';
  const lectureId = 'lec_math10_quad_01';

  // 1. Test saving question attempt with lectureId and correctAnswer
  console.log('\n[1] Testing Question Attempt with lectureId:');
  const attempt = await saveQuizAttempt({
    quizId,
    lectureId,
    questionId: 'q1',
    selectedAnswer: 'B',
    correctAnswer: 'B',
    score: 1,
  });

  console.log('✓ Saved attempt record:', attempt);
  if (attempt.lectureId !== lectureId) throw new Error('lectureId was not saved in attempt');
  if (attempt.selectedAnswer !== 'B') throw new Error('selectedAnswer mismatch');
  if (attempt.correctAnswer !== 'B') throw new Error('correctAnswer mismatch');
  if (attempt.score !== 1) throw new Error('score mismatch');
  if (attempt.status !== 'pending') throw new Error('status must be pending');

  // 2. Test reading question attempt
  console.log('\n[2] Testing Question Retrieval:');
  const retrieved = await getQuizAttempt(quizId, 'q1');
  console.log('✓ Retrieved attempt:', retrieved);
  if (!retrieved || retrieved.selectedAnswer !== 'B') throw new Error('Failed to retrieve attempt');

  // 3. Test saving full quiz submission
  console.log('\n[3] Testing Full Quiz Submission:');
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
  console.log('✓ Saved submission record:', savedSub);
  if (savedSub.score !== 4) throw new Error('score mismatch in submission');
  if (savedSub.status !== 'pending') throw new Error('submission status must be pending');
  if (!savedSub.createdAt || !savedSub.updatedAt) throw new Error('timestamps missing');

  // 4. Test retrieving saved submission (Persisted State / Page Reload)
  console.log('\n[4] Testing Submission Retrieval (Simulating Page Reload / Reopen):');
  const retrievedSub = await getQuizSubmission(quizId, lectureId);
  console.log('✓ Retrieved submission:', retrievedSub);
  if (!retrievedSub) throw new Error('Failed to retrieve submission');
  if (retrievedSub.score !== 4) throw new Error('Retrieved score mismatch');
  if (retrievedSub.answersMap.q1 !== 'B') throw new Error('Retrieved answersMap mismatch');

  // 5. Test Pending Sync Count
  console.log('\n[5] Testing Pending Sync Count:');
  const pendingCount = await getPendingSyncCount();
  console.log(`✓ Pending sync count: ${pendingCount}`);
  if (pendingCount < 1) throw new Error('Expected at least 1 pending sync item');

  console.log('\n==================================================================');
  console.log('🎉 ALL PART 3 UPGRADE (LECTURE-TIED QUIZ) IDB TESTS PASSED! 🎉');
  console.log('==================================================================');
}

testUpgradedIndexedDB().catch((err) => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
