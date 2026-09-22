# Member 3 Backend Integration Report

**Branch inspected:** `member3-backend-integration`
**Comparison branch:** `origin/backend-sync` (read-only)
**Inspection date:** 2026-09-22

This report records code-level findings only. The feature labels below do not mean the behavior passed runtime testing unless a test is explicitly listed as executed in this inspection.

## Already Implemented

### Current backend and persistence

- Express server, JSON/form middleware, CORS, health endpoint, static uploads, route registration, 404 handling, and global error handling: [backend/src/server.js](../backend/src/server.js), [backend/package.json](../backend/package.json).
- MongoDB connection through Mongoose with `MONGODB_URI` support and an automatic `mongodb-memory-server` fallback when the URI is absent or fails: [backend/src/config/db.js](../backend/src/config/db.js).
- Lecture document with contract IDs, course metadata, current version, and embedded lecture quiz definition: [backend/src/models/Lecture.js](../backend/src/models/Lecture.js).
- Version document with `lectureId`, `versionId`, file metadata, SHA-256 hash, verification status, active-version flag, and correction details: [backend/src/models/LectureVersion.js](../backend/src/models/LectureVersion.js).
- Synced quiz-submission and timestamped-doubt persistence models: [backend/src/models/QuizSubmission.js](../backend/src/models/QuizSubmission.js), [backend/src/models/StudentDoubt.js](../backend/src/models/StudentDoubt.js).
- Multer disk upload and SHA-256 file hashing: [backend/src/utils/fileUpload.js](../backend/src/utils/fileUpload.js).

### Lecture and version APIs

- Create and list lectures: `POST /api/lectures`, `GET /api/lectures`: [backend/src/routes/lectureRoutes.js](../backend/src/routes/lectureRoutes.js), [backend/src/controllers/lectureController.js](../backend/src/controllers/lectureController.js).
- List lecture version history: `GET /api/lectures/:lectureId/versions`.
- Upload a new version, compute file hash, preserve prior versions, mark the new version active, update `currentVersion`, and optionally store quiz/correction metadata: `POST /api/lectures/:lectureId/versions`.
- Read the active version: `GET /api/lectures/:lectureId/latest-version`.
- Generate per-version chunk metadata and serve individual chunks: `GET /api/lectures/:lectureId/versions/:versionId/manifest` and `GET /api/lectures/:lectureId/versions/:versionId/chunks/:chunkIndex`: [backend/src/controllers/lectureController.js](../backend/src/controllers/lectureController.js).

### Existing frontend integration

- Lecture fetch/create/publish/version-history calls: [frontend/src/App.jsx](../frontend/src/App.jsx), [frontend/src/components/CreateLectureModal.jsx](../frontend/src/components/CreateLectureModal.jsx), [frontend/src/components/LectureDetailsModal.jsx](../frontend/src/components/LectureDetailsModal.jsx).
- Download manifest/chunk/latest-version calls and client-side chunk/file hash verification with resumable checkpoints: [frontend/src/components/LectureDownloadPanel.jsx](../frontend/src/components/LectureDownloadPanel.jsx).
- Vite proxies `/api` and `/uploads` to the backend: [frontend/vite.config.js](../frontend/vite.config.js).
- IndexedDB version 4 stores question attempts, quiz submissions, timestamped doubts, download state, and download chunks: [frontend/src/utils/indexedDB.js](../frontend/src/utils/indexedDB.js).
- Offline quiz answer/submission workflow: [frontend/src/components/StudentQuiz.jsx](../frontend/src/components/StudentQuiz.jsx).
- Offline playback and automatic `mm:ss` doubt timestamp capture: [frontend/src/components/OfflineVideoPlayer.jsx](../frontend/src/components/OfflineVideoPlayer.jsx).
- MicroSync review, upload, and local status update workflow: [frontend/src/components/MicroSyncModal.jsx](../frontend/src/components/MicroSyncModal.jsx).

### Current MicroSync API

- `POST /api/sync/microsync` accepts `quizzes` and `doubts`, upserts quiz submissions by `(quizId, lectureId)`, upserts doubts by `doubtId`, and returns synced counts: [backend/src/routes/syncRoutes.js](../backend/src/routes/syncRoutes.js), [backend/src/controllers/syncController.js](../backend/src/controllers/syncController.js).
- `GET /api/sync/status` reports stored quiz and doubt document counts.

## Missing or Incomplete

These are gaps relative to the requested backend integration scope and the old branch’s broader contract. They are not claims that existing UI code is absent.

### MongoDB

- **Partially implemented, not verified here.** Mongoose models and connection startup exist, including an in-memory fallback. There is no runtime evidence from this inspection that Atlas, fallback startup, indexes, or persistence were successfully exercised.
- The current models use string IDs and do not include the old branch’s required `studentId`, explicit version references, or action-level idempotency record.

### Lecture/version APIs

- **Implemented in source, not verified here.** The current API has create/list/history/latest-version, upload, manifest, and chunk routes.
- There is no separate draft-then-publish endpoint. Uploading a version immediately marks it verified and active.
- The manifest is generated by reading the whole file and calculating chunk hashes per request; chunk metadata is not persisted in MongoDB.
- The current chunk route returns `200` and custom headers. The old branch returned `206` with `Content-Range` and persisted chunk size/hash metadata.
- `fileUrl` is stored and served, but file cleanup and upload rollback after later database failures are not handled in the current controller.

### Progress API

- **Missing.** No progress model, route, controller, or frontend HTTP call was found for `downloadedBytes`, `playbackPosition`, or `syncStatus` as a server-side progress record.
- The frontend stores download checkpoint/progress locally in IndexedDB: [frontend/src/utils/indexedDB.js](../frontend/src/utils/indexedDB.js), [frontend/src/components/LectureDownloadPanel.jsx](../frontend/src/components/LectureDownloadPanel.jsx).

### Quiz-attempt API

- **Missing as a dedicated API.** The current backend stores only final/upserted `QuizSubmission` records through MicroSync. It has no `QuizAttempt` model or `/quiz-attempts` route.
- The frontend does store per-question attempts locally, but MicroSync converts pending attempts to quiz-shaped payloads and the backend upsert key can collapse multiple attempts for the same quiz/lecture: [frontend/src/components/MicroSyncModal.jsx](../frontend/src/components/MicroSyncModal.jsx), [backend/src/controllers/syncController.js](../backend/src/controllers/syncController.js).
- There is no student identity or version association on the current quiz submission model.

### Timestamped doubt API

- **Partially implemented.** Timestamped doubts are stored locally and persisted server-side only when included in `/api/sync/microsync`: [frontend/src/components/OfflineVideoPlayer.jsx](../frontend/src/components/OfflineVideoPlayer.jsx), [backend/src/models/StudentDoubt.js](../backend/src/models/StudentDoubt.js).
- There is no dedicated create/list/reply doubt API, no `studentId`, and no `versionId` association. The timestamp is a string rather than the old branch’s numeric `videoTimestamp`.

### Manifest/chunk support

- **Implemented in source, not verified here.** Current lecture routes expose manifest and chunk endpoints and the frontend verifies both chunk hashes and the reconstructed file hash.
- The implementation reads the entire file into memory for each manifest/chunk request and uses an environment-dependent chunk size (`10 KiB` outside production, `64 KiB` in production): [backend/src/controllers/lectureController.js](../backend/src/controllers/lectureController.js).
- Invalid chunk indexes beyond the file are reported as `404`; there is no explicit range/status contract test in the current test scripts.

### MicroSync

- **Implemented for quiz submissions and doubts in source, not verified here.** The endpoint is wired end to end through the modal, but there is no progress action support, generic action idempotency, per-record result handling, authentication/student identity, or server-side version validation.
- The frontend marks all locally pending records as synced after a successful HTTP response based on batch counts; it does not reconcile individual accepted/skipped record IDs.
- Current automated scripts listed in the repository do not provide dedicated server-side endpoint assertions for `/api/sync/microsync` with a fresh database in this inspection. Existing claims are documented in [docs/QA_EVIDENCE.md](QA_EVIDENCE.md), but were not rerun here.

## Reusable Old Code

The following pieces from `origin/backend-sync` are useful patterns to adapt, not code to merge wholesale:

- **Generic action envelope and idempotency:** `backend/src/routes/sync.js` validates `actionId`, `type`, `studentId`, `lectureId`, `versionId`, payload, and timestamp, then stores a unique `SyncAction`. Adapt the validation/idempotency idea to the current string-ID contract and existing `/api/sync/microsync` route.
- **Progress action type:** the old route explicitly supports `progress` alongside quiz and doubt actions. Use this as the basis for a progress API/action while preserving the current contract fields `downloadedBytes`, `playbackPosition`, and `syncStatus`.
- **Dedicated doubt and quiz endpoints:** the old route exposes `POST/GET /doubts`, doubt reply, and `POST/GET /quiz-attempts`. The endpoint separation is reusable, but its ObjectId, `studentId`, `versionId`, and payload shapes need reconciliation with current models and frontend IDs.
- **Persisted manifest metadata:** `backend/src/routes/lectures.js` computes and stores file chunk size, total chunks, file hash, and chunk hashes at upload time. This can improve the current on-demand manifest implementation without changing the current `lectureId`/`versionId` names.
- **Explicit publish transition and correction validation:** the old route separates upload from publish and requires structured correction metadata for a later version. This is reusable only if the team wants to change the current immediate-publish behavior.
- **Error handling conventions:** the old app maps Multer size errors and Mongoose validation errors to stable client responses. The current server’s global error handler could adopt those mappings without replacing current routes.

The old branch is not directly compatible with the current application because it uses Mongo ObjectIds as lecture/version references, a different URL layout, a different manifest shape, `teacherId` as a required field, and `SyncAction` payloads rather than the current quiz/doubt batch shape.

## Integration Plan

Priority is ordered to preserve the current backend and existing teammate features.

1. **Keep unchanged:** [docs/CONTRACT.md](CONTRACT.md), [backend/src/server.js](../backend/src/server.js), current lecture routes/controllers/models, upload utility, frontend lecture/version/download components, and IndexedDB stores. First run the existing backend and frontend tests to establish a real baseline.
2. **Add focused backend tests:** create tests for Mongo startup, lecture/version history, latest version, manifest/chunk hash and invalid-index behavior, and MicroSync upsert behavior. Do not rely solely on the claims in [docs/QA_EVIDENCE.md](QA_EVIDENCE.md).
3. **Modify sync contract minimally:** extend [backend/src/controllers/syncController.js](../backend/src/controllers/syncController.js) and [backend/src/routes/syncRoutes.js](../backend/src/routes/syncRoutes.js) to support validated progress records and per-item results, while retaining `/api/sync/microsync` for current frontend compatibility.
4. **Create a progress persistence surface:** add a progress model and controller/route using the contract’s `lectureId`, `versionId`, `downloadedBytes`, `playbackPosition`, and `syncStatus`. Then add frontend calls only after the request/response shape is agreed.
5. **Create a dedicated quiz-attempt surface:** add a model and route if per-question attempts must be retained server-side. Keep `QuizSubmission` for final results and avoid collapsing attempts by `(quizId, lectureId)`.
6. **Extend timestamped doubts deliberately:** either add dedicated doubt list/create/reply routes or document MicroSync as the only write path. Add version and student identity only with an agreed contract update; do not silently rename the current `timestamp` field.
7. **Improve manifest/chunk efficiency:** persist immutable chunk metadata during upload and stream chunks from disk with explicit bounds/status headers, preserving current response fields or versioning the API if the frontend contract must change.
8. **Update frontend wiring:** modify [frontend/src/components/MicroSyncModal.jsx](../frontend/src/components/MicroSyncModal.jsx), [frontend/src/components/LectureDownloadPanel.jsx](../frontend/src/components/LectureDownloadPanel.jsx), and [frontend/src/utils/indexedDB.js](../frontend/src/utils/indexedDB.js) only against tested backend contracts. Add end-to-end tests for retry, partial acceptance, version mismatch, and local record retention.
9. **Re-run verification:** execute backend API tests, IndexedDB tests, MicroSync tests, and `npm run build` in [frontend/package.json](../frontend/package.json). Record actual commands and results in [docs/QA_EVIDENCE.md](QA_EVIDENCE.md) rather than treating prior prose as fresh evidence.

## Verification Performed During This Inspection

- Read current contract, README, package manifests, server, backend routes/controllers/models/utilities, frontend API callers, IndexedDB implementation, download/MicroSync/quiz/doubt components, Vite proxy, and existing QA/test files.
- Compared `origin/backend-sync` backend tree and backend diffs with the current branch using read-only Git commands.
- **No application runtime test was executed during this inspection.** Therefore this report makes no runtime claim that the listed endpoints, MongoDB connection, browser flows, or builds currently pass.