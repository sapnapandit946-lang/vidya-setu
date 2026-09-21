# Vidya Setu Team Contract

## Common IDs
- lectureId
- versionId
- fileSize
- fileHash
- chunkIndex
- totalChunks

## Common Progress Fields
- downloadedBytes
- playbackPosition
- syncStatus

## Approved Status Words
- V1
- V2
- Offline
- Checkpoint Saved
- Pending Sync
- Syncing
- Synced
- Verified
- Needs Review
- Available Offline

## Important Rule
Do not rename or change these common fields without agreement from the whole team.

## Git Workflow
- Developers work on their assigned branch.
- Test locally before committing.
- Create Pull Requests into integration.
- Do not directly push feature work into main.
- Integration Owner reviews and merges Pull Requests.
- Only stable integration code goes into main.