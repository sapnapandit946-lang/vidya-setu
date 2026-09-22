/**
 * IndexedDB Offline Storage for Vidya Setu
 * Manages lecture-connected offline quiz attempts and submissions completely without internet.
 */

const DB_NAME = 'VidyaSetuOfflineDB';
const DB_VERSION = 4; // Bumped version for resumable lecture downloads
const STORE_ATTEMPTS = 'quizAttempts';
const STORE_SUBMISSIONS = 'quizSubmissions';
const STORE_DOUBTS = 'offlineDoubts';
const STORE_LECTURE_DOWNLOADS = 'lectureDownloads';
const STORE_LECTURE_CHUNKS = 'lectureDownloadChunks';

/**
 * Opens or initializes the IndexedDB database
 */
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const idb = typeof window !== 'undefined' ? window.indexedDB : globalThis.indexedDB;
    if (!idb) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. quizAttempts store: stores individual question answers
      if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) {
        const store = db.createObjectStore(STORE_ATTEMPTS, {
          keyPath: ['quizId', 'questionId'],
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('quizId', 'quizId', { unique: false });
        store.createIndex('lectureId', 'lectureId', { unique: false });
      } else {
        const store = event.target.transaction.objectStore(STORE_ATTEMPTS);
        if (!store.indexNames.contains('lectureId')) {
          store.createIndex('lectureId', 'lectureId', { unique: false });
        }
      }

      // 2. quizSubmissions store: stores full submitted quiz results
      if (!db.objectStoreNames.contains(STORE_SUBMISSIONS)) {
        const subStore = db.createObjectStore(STORE_SUBMISSIONS, {
          keyPath: ['quizId', 'lectureId'],
        });
        subStore.createIndex('status', 'status', { unique: false });
        subStore.createIndex('lectureId', 'lectureId', { unique: false });
      }

      // 3. offlineDoubts store: stores timestamped doubts tied to lectureId
      if (!db.objectStoreNames.contains(STORE_DOUBTS)) {
        const doubtStore = db.createObjectStore(STORE_DOUBTS, {
          keyPath: 'doubtId',
        });
        doubtStore.createIndex('lectureId', 'lectureId', { unique: false });
        doubtStore.createIndex('status', 'status', { unique: false });
      }

      // 4. Version-scoped lecture download checkpoints and chunks
      if (!db.objectStoreNames.contains(STORE_LECTURE_DOWNLOADS)) {
        const downloadStore = db.createObjectStore(STORE_LECTURE_DOWNLOADS, {
          keyPath: ['lectureId', 'versionId'],
        });
        downloadStore.createIndex('lectureId', 'lectureId', { unique: false });
        downloadStore.createIndex('downloadStatus', 'downloadStatus', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_LECTURE_CHUNKS)) {
        const chunkStore = db.createObjectStore(STORE_LECTURE_CHUNKS, {
          keyPath: ['lectureId', 'versionId', 'chunkIndex'],
        });
        chunkStore.createIndex('lectureId', 'lectureId', { unique: false });
        chunkStore.createIndex('versionId', 'versionId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};


/**
 * Saves or updates an individual question attempt
 * Structure:
 * - quizId
 * - lectureId
 * - questionId
 * - selectedAnswer
 * - correctAnswer (optional)
 * - score (optional)
 * - status: 'pending'
 * - createdAt
 * - updatedAt
 */
export const saveQuizAttempt = async ({
  quizId,
  lectureId,
  versionId,
  questionId,
  selectedAnswer,
  correctAnswer,
  score,
}) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ATTEMPTS, 'readwrite');
    const store = tx.objectStore(STORE_ATTEMPTS);

    const getReq = store.get([quizId, questionId]);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      const now = new Date().toISOString();

      const record = {
        quizId,
        lectureId: lectureId || existing?.lectureId || 'unknown_lecture',
        versionId: versionId || existing?.versionId || null,
        questionId,
        selectedAnswer,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : existing?.correctAnswer,
        score: score !== undefined ? score : existing?.score,
        status: 'pending',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const putReq = store.put(record);

      putReq.onsuccess = () => {
        resolve(record);
      };

      putReq.onerror = (e) => {
        reject(e.target.error);
      };
    };

    getReq.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Retrieves a specific saved answer for a quiz question
 */
export const getQuizAttempt = async (quizId, questionId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
    const store = tx.objectStore(STORE_ATTEMPTS);
    const request = store.get([quizId, questionId]);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Saves a completed quiz submission result
 * Structure:
 * - quizId
 * - lectureId
 * - score
 * - totalQuestions
 * - correctCount
 * - wrongCount
 * - answersMap: { [questionId]: selectedAnswer }
 * - status: "pending"
 * - createdAt
 * - updatedAt
 */
export const saveQuizSubmission = async ({
  quizId,
  lectureId,
  versionId,
  score,
  totalQuestions,
  correctCount,
  wrongCount,
  answersMap,
}) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SUBMISSIONS);

    const getReq = store.get([quizId, lectureId]);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      const now = new Date().toISOString();

      const record = {
        quizId,
        lectureId,
        versionId: versionId || existing?.versionId || null,
        score,
        totalQuestions,
        correctCount,
        wrongCount,
        answersMap,
        status: 'pending',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const putReq = store.put(record);

      putReq.onsuccess = () => {
        resolve(record);
      };

      putReq.onerror = (e) => {
        reject(e.target.error);
      };
    };

    getReq.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Retrieves a saved quiz submission result for a lecture
 */
export const getQuizSubmission = async (quizId, lectureId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SUBMISSIONS, 'readonly');
    const store = tx.objectStore(STORE_SUBMISSIONS);
    const request = store.get([quizId, lectureId]);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Clears/resets attempts and submission for a quiz to allow clean retake
 */
export const resetQuizState = async (quizId, lectureId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ATTEMPTS, STORE_SUBMISSIONS], 'readwrite');
    const subStore = tx.objectStore(STORE_SUBMISSIONS);
    subStore.delete([quizId, lectureId]);

    tx.oncomplete = () => {
      resolve(true);
    };
    tx.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Saves a timestamped doubt offline
 * Structure:
 * - doubtId
 * - lectureId
 * - timestamp
 * - text
 * - status: "pending"
 * - createdAt
 * - updatedAt
 */
export const saveOfflineDoubt = async ({ lectureId, timestamp, text }) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOUBTS, 'readwrite');
    const store = tx.objectStore(STORE_DOUBTS);

    const now = new Date().toISOString();
    const doubtId = `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const doubtRecord = {
      doubtId,
      lectureId,
      timestamp,
      text: text.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const req = store.put(doubtRecord);

    req.onsuccess = () => {
      resolve(doubtRecord);
    };

    req.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Retrieves all offline doubts for a specific lecture
 */
export const getDoubtsForLecture = async (lectureId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOUBTS, 'readonly');
    const store = tx.objectStore(STORE_DOUBTS);
    const index = store.index('lectureId');
    const request = index.getAll(lectureId);

    request.onsuccess = () => {
      const results = request.result || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Fetches all pending offline doubts
 */
export const getAllPendingDoubts = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOUBTS, 'readonly');
    const store = tx.objectStore(STORE_DOUBTS);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Fetches all pending quiz attempts
 */
export const getAllPendingAttempts = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
    const store = tx.objectStore(STORE_ATTEMPTS);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Fetches all pending quiz submissions
 */
export const getAllPendingSubmissions = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SUBMISSIONS, 'readonly');
    const store = tx.objectStore(STORE_SUBMISSIONS);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

/**
 * Marks specific quiz attempts as 'synced' in IndexedDB (does not delete them)
 */
export const markQuizAttemptsAsSynced = async (attemptKeys = []) => {
  if (!attemptKeys.length) return true;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ATTEMPTS, 'readwrite');
    const store = tx.objectStore(STORE_ATTEMPTS);

    attemptKeys.forEach(({ quizId, questionId }) => {
      const req = store.get([quizId, questionId]);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          item.status = 'synced';
          item.updatedAt = new Date().toISOString();
          store.put(item);
        }
      };
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Marks specific quiz submissions as 'synced' in IndexedDB (does not delete them)
 */
export const markQuizSubmissionsAsSynced = async (submissionKeys = []) => {
  if (!submissionKeys.length) return true;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SUBMISSIONS);

    submissionKeys.forEach(({ quizId, lectureId }) => {
      const req = store.get([quizId, lectureId]);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          item.status = 'synced';
          item.updatedAt = new Date().toISOString();
          store.put(item);
        }
      };
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Marks specific doubts as 'synced' in IndexedDB (does not delete them)
 */
export const markDoubtsAsSynced = async (doubtIds = []) => {
  if (!doubtIds.length) return true;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOUBTS, 'readwrite');
    const store = tx.objectStore(STORE_DOUBTS);

    doubtIds.forEach((doubtId) => {
      const req = store.get(doubtId);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          item.status = 'synced';
          item.updatedAt = new Date().toISOString();
          store.put(item);
        }
      };
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Returns total count of all pending offline items (quiz attempts/submissions + doubts) awaiting sync
 */
export const getPendingSyncCount = async () => {
  try {
    const [attempts, submissions, doubts] = await Promise.all([
      getAllPendingAttempts(),
      getAllPendingSubmissions(),
      getAllPendingDoubts(),
    ]);

    // Count distinct units of pending sync: pending submissions or attempts + doubts
    const pendingQuizzesCount = submissions?.length > 0 ? submissions.length : attempts?.length;
    return (pendingQuizzesCount || 0) + (doubts?.length || 0);
  } catch (err) {
    console.error('Error computing pending sync count:', err);
    return 0;
  }
};

export const saveLectureDownloadState = async (state) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LECTURE_DOWNLOADS, 'readwrite');
    const request = tx.objectStore(STORE_LECTURE_DOWNLOADS).put(state);
    request.onsuccess = () => resolve(state);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getLectureDownloadState = async (lectureId, versionId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_LECTURE_DOWNLOADS, 'readonly')
      .objectStore(STORE_LECTURE_DOWNLOADS)
      .get([lectureId, versionId]);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getLectureDownloadStates = async (lectureId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_LECTURE_DOWNLOADS, 'readonly')
      .objectStore(STORE_LECTURE_DOWNLOADS)
      .index('lectureId')
      .getAll(lectureId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveLectureDownloadChunk = async (chunk) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LECTURE_CHUNKS, 'readwrite');
    const request = tx.objectStore(STORE_LECTURE_CHUNKS).put(chunk);
    request.onsuccess = () => resolve(chunk);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getLectureDownloadChunks = async (lectureId, versionId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_LECTURE_CHUNKS, 'readonly')
      .objectStore(STORE_LECTURE_CHUNKS)
      .getAll();
    request.onsuccess = () => resolve(
      (request.result || []).filter(
        (chunk) => chunk.lectureId === lectureId && chunk.versionId === versionId
      )
    );
    request.onerror = (event) => reject(event.target.error);
  });
};


