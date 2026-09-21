# Vidya Setu backend

## Run

```powershell
cd C:\Users\Administrator\OneDrive\Desktop\vidya\vidya-setu\backend
npm run dev
```

Required environment variable: `MONGODB_URI` (or `MONGO_URI`). Optional variables are `PORT`, `UPLOAD_DIR`, and `CHUNK_SIZE`. Copy `.env.example` to `.env` and set the local MongoDB URI; secrets are never committed.

## API contract

Lecture creation uses `POST /api/lectures` with `{ "title", "teacherId", "description", "subject" }`. Upload a real file with multipart `POST /api/lectures/:lectureId/versions`, field `file`, and optional `chunkSize`. The response includes a version and manifest:

```json
{
  "lectureId": "...",
  "versionId": "...",
  "version": "V1",
  "fileSize": 1048576,
  "chunkSize": 262144,
  "totalChunks": 4,
  "fileSha256": "sha256 hex",
  "chunkHashes": ["sha256 hex"]
}
```

Use `GET /api/lectures/:lectureId/latest`, `GET /api/versions/:versionId`, and `GET /api/versions/:versionId/manifest`. Download an individual binary chunk with `GET /api/versions/:versionId/chunks/:chunkIndex`; it returns `206`, `Content-Range`, and `X-Chunk-Sha256`. Invalid indexes return `416`.

Publish a draft with `POST /api/lectures/:lectureId/versions/:versionId/publish`. For V2 and later, include `changedSectionStart`, `changedSectionEnd`, `correctionText`, and `updateSeverity` (`low`, `medium`, or `high`). Previous version files and hashes are retained.

MicroSync accepts `POST /api/sync/batch`:

```json
{
  "actions": [{
    "actionId": "device-uuid-1",
    "type": "progress",
    "studentId": "student-1",
    "lectureId": "...",
    "versionId": "...",
    "payload": { "positionSeconds": 42 },
    "createdAt": "2026-09-21T10:00:00.000Z"
  }]
}
```

Supported types are `progress`, `quiz_submission`, and `doubt`. Retries with the same `actionId` are acknowledged as successful duplicates after the original record exists. Doubts use `POST /api/doubts`, `GET /api/doubts`, and `PATCH /api/doubts/:doubtId/reply`; quiz attempts use `POST /api/quiz-attempts` and `GET /api/quiz-attempts`.