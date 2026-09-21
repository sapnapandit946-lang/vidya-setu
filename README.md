# Vidya Setu - Part 1: Teacher V1 Publishing MVP

## Overview
Part 1 of Vidya Setu implements the **Teacher V1 Publishing Flow**, adhering to the team `CONTRACT.md` data models, approved status terms, and modular architecture.

---

## Architecture & Technology Stack
- **Frontend**: React 18 + Vite (`/frontend`), Lucide React icons, responsive EdTech dashboard with clean design system (Inter font, cards, badges, light theme, blue primary accent `#1d4ed8`).
- **Backend**: Node.js + Express (`/backend`), Multer for sample lecture file uploads, SHA-256 file hashing, Mongoose schema modeling with fallback to In-Memory MongoDB for local development if MongoDB Atlas URI is not provided.
- **Contract & IDs**: Strict adherence to `docs/CONTRACT.md`:
  - `lectureId`, `versionId`, `courseId`, `title`, `subject`, `description`, `currentVersion`, `createdAt`, `updatedAt`
  - `fileName`, `fileUrl`, `fileSize`, `fileHash`, `verificationStatus: "verified"`, `isActive: true`
  - Badges: `V1`, `Published`, `Verified`

---

## API Endpoints Implemented
1. `POST /api/lectures` — Create lecture record with `lectureId`, `courseId`, `title`, `subject`, `description`.
2. `GET /api/lectures` — Fetch all lectures enriched with latest active version details.
3. `POST /api/lectures/:lectureId/versions` — Upload sample lecture file, compute SHA-256 `fileHash`, create version record `V1` with `verificationStatus: "verified"` and `isActive: true`.
4. `GET /api/lectures/:lectureId/latest-version` — Fetch latest active version for a specific lecture.

---

## Running Locally

### Backend
```bash
cd backend
npm install
# Set MONGODB_URI in .env (optional; falls back to embedded MongoDB server automatically)
npm start
```
Runs at: `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173` (proxies `/api` and `/uploads` to port 5000)

---

## Verification
Automated test suite (`backend/test-verification.js`):
```bash
node backend/test-verification.js
```
All endpoints and publishing flows verified:
- [x] POST /api/lectures
- [x] POST /api/lectures/:lectureId/versions
- [x] GET /api/lectures
- [x] GET /api/lectures/:lectureId/latest-version
- [x] Vite production build (`npm run build`)
