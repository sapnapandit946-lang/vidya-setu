import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Pause,
  Play,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  getLectureDownloadChunks,
  getLectureDownloadState,
  getLectureDownloadStates,
  saveLectureDownloadChunk,
  saveLectureDownloadState,
} from '../utils/indexedDB.js';
import { saveProgressToBackend } from '../utils/backendApi.js';

const DOWNLOAD_STATUSES = ['not_started', 'downloading', 'paused', 'completed', 'failed'];
const VERIFICATION_STATUSES = ['pending', 'verified', 'failed'];

const getVersionName = (versionId, currentVersion) => {
  if (currentVersion) return currentVersion;
  const versionNumber = versionId?.match(/[_-]v(\d+)(?:[_-]|$)/i)?.[1];
  return versionNumber ? `V${versionNumber}` : 'V1';
};

const createDownloadState = ({ lectureId, versionId, versionName, localVersion = versionName, manifest, versionMismatch = false }) => ({
  lectureId,
  versionId,
  fileSize: manifest.fileSize,
  fileHash: manifest.fileHash,
  totalBytes: manifest.totalBytes,
  downloadedBytes: 0,
  downloadProgress: 0,
  completedChunks: [],
  currentChunk: 0,
  totalChunks: manifest.totalChunks,
  checkpoint: 0,
  downloadStatus: 'not_started',
  lastCheckpointAt: null,
  localVersion,
  serverVersion: versionName,
  latestVersion: versionName,
  versionMismatch,
  isVerified: false,
  verificationStatus: 'pending',
  manifestChunks: manifest.chunks,
});

const digestBuffer = async (buffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const getManifest = async (lectureId, versionId) => {
  const response = await fetch(
    `/api/lectures/${encodeURIComponent(lectureId)}/versions/${encodeURIComponent(versionId)}/manifest`
  );
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not load download manifest.');
  return data;
};

const getChunk = async (lectureId, versionId, chunkIndex) => {
  const response = await fetch(
    `/api/lectures/${encodeURIComponent(lectureId)}/versions/${encodeURIComponent(versionId)}/chunks/${chunkIndex}`
  );
  if (!response.ok) throw new Error(`Could not download chunk ${chunkIndex}.`);
  return response;
};

export const LectureDownloadPanel = ({ lecture, onWatchOffline }) => {
  const lectureId = lecture?.lectureId;
  const initialVersionId = lecture?.versionId;
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  const [downloadState, setDownloadState] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const stateRef = useRef(null);
  const onlineRef = useRef(true);
  const downloadingRef = useRef(false);
  const pauseRequestedRef = useRef(false);
  const manuallyPausedRef = useRef(false);

  const isDev = import.meta.env.DEV;
  const isOnline = browserOnline;

  useEffect(() => {
    onlineRef.current = isOnline;
  }, [isOnline]);

  const persistState = async (nextState) => {
    stateRef.current = nextState;
    setDownloadState(nextState);
    await saveLectureDownloadState(nextState);
    saveProgressToBackend({
      lectureId: nextState.lectureId,
      versionId: nextState.versionId,
      downloadedBytes: nextState.downloadedBytes,
      syncStatus: 'Synced',
    }).catch(() => {});
  };

  const pauseDownload = async (manualPause = false) => {
    const currentState = stateRef.current;
    if (!currentState || currentState.downloadStatus !== 'downloading') return;
    if (manualPause) manuallyPausedRef.current = true;
    pauseRequestedRef.current = true;
    await persistState({
      ...currentState,
      downloadStatus: 'paused',
      checkpoint: currentState.completedChunks.length,
      lastCheckpointAt: new Date().toISOString(),
    });
  };

  const prepareVersion = async ({ versionId, versionName, versionMismatch = false }) => {
    const manifest = await getManifest(lectureId, versionId);
    const existingState = await getLectureDownloadState(lectureId, versionId);
    const chunks = await getLectureDownloadChunks(lectureId, versionId);
    const completedChunks = chunks
      .filter((chunk) => chunk.chunkStatus === 'completed' && chunk.lectureId === lectureId && chunk.versionId === versionId)
      .map((chunk) => chunk.chunkIndex)
      .sort((first, second) => first - second);
    const downloadedBytes = chunks.reduce((total, chunk) => (
      completedChunks.includes(chunk.chunkIndex) ? total + chunk.chunkSize : total
    ), 0);
    const recoveredState = existingState
      ? {
        ...existingState,
        fileSize: manifest.fileSize,
        fileHash: manifest.fileHash,
        totalBytes: manifest.totalBytes,
        totalChunks: manifest.totalChunks,
        completedChunks,
        downloadedBytes,
        downloadProgress: manifest.totalBytes ? Math.round((downloadedBytes / manifest.totalBytes) * 100) : 0,
        currentChunk: Array.from({ length: manifest.totalChunks }, (_, chunkIndex) => chunkIndex)
          .find((chunkIndex) => !completedChunks.includes(chunkIndex)) ?? manifest.totalChunks,
        checkpoint: completedChunks.length,
        manifestChunks: manifest.chunks,
        serverVersion: versionName,
        latestVersion: versionName,
        versionMismatch: existingState.versionMismatch || versionMismatch,
      }
      : createDownloadState({ lectureId, versionId, versionName, manifest, versionMismatch });

    await persistState(recoveredState);
    return recoveredState;
  };

  const verifyDownload = async (currentState, chunks) => {
    const orderedChunks = chunks
      .filter((chunk) => chunk.lectureId === lectureId && chunk.versionId === currentState.versionId)
      .sort((first, second) => first.chunkIndex - second.chunkIndex);
    const fileBuffer = await new Blob(orderedChunks.map((chunk) => chunk.data)).arrayBuffer();
    const fileHash = await digestBuffer(fileBuffer);
    if (fileHash !== currentState.fileHash) {
      throw new Error('Downloaded file hash did not match the published version.');
    }
    return {
      ...currentState,
      downloadStatus: 'completed',
      downloadProgress: 100,
      downloadedBytes: currentState.totalBytes,
      currentChunk: currentState.totalChunks,
      checkpoint: currentState.totalChunks,
      isVerified: true,
      verificationStatus: 'verified',
      lastCheckpointAt: new Date().toISOString(),
    };
  };

  const runDownload = async (startingState) => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    pauseRequestedRef.current = false;
    setErrorMessage(null);

    try {
      let currentState = {
        ...startingState,
        downloadStatus: 'downloading',
        verificationStatus: 'pending',
        lastCheckpointAt: new Date().toISOString(),
      };
      await persistState(currentState);
      let storedChunks = await getLectureDownloadChunks(lectureId, currentState.versionId);
      const completedChunkSet = new Set(currentState.completedChunks);

      for (let chunkIndex = 0; chunkIndex < currentState.totalChunks; chunkIndex += 1) {
        if (!onlineRef.current || pauseRequestedRef.current) {
          await pauseDownload();
          return;
        }
        if (completedChunkSet.has(chunkIndex)) continue;

        currentState = {
          ...currentState,
          currentChunk: chunkIndex,
          checkpoint: completedChunkSet.size,
          downloadStatus: 'downloading',
        };
        await persistState(currentState);

        const manifestChunk = currentState.manifestChunks[chunkIndex];
        const response = await getChunk(lectureId, currentState.versionId, chunkIndex);
        const chunkData = await response.arrayBuffer();
        if (!onlineRef.current) {
          await pauseDownload();
          return;
        }

        const chunkHash = await digestBuffer(chunkData);
        if (chunkHash !== manifestChunk.chunkHash) {
          throw new Error(`Chunk ${chunkIndex} hash did not match the manifest.`);
        }

        const chunkRecord = {
          chunkId: manifestChunk.chunkId,
          lectureId,
          versionId: currentState.versionId,
          chunkIndex,
          chunkSize: chunkData.byteLength,
          chunkHash,
          chunkStatus: 'completed',
          data: chunkData,
        };
        await saveLectureDownloadChunk(chunkRecord);
        storedChunks = [...storedChunks.filter((chunk) => chunk.chunkIndex !== chunkIndex), chunkRecord];
        completedChunkSet.add(chunkIndex);
        const downloadedBytes = storedChunks.reduce((total, chunk) => total + chunk.chunkSize, 0);
        currentState = {
          ...currentState,
          downloadedBytes,
          downloadProgress: currentState.totalBytes ? Math.round((downloadedBytes / currentState.totalBytes) * 100) : 0,
          completedChunks: [...completedChunkSet].sort((first, second) => first - second),
          currentChunk: chunkIndex + 1,
          checkpoint: chunkIndex + 1,
          lastCheckpointAt: new Date().toISOString(),
          downloadStatus: 'downloading',
        };
        await persistState(currentState);

        if (pauseRequestedRef.current) {
          await persistState({
            ...currentState,
            downloadStatus: 'paused',
            checkpoint: completedChunkSet.size,
            lastCheckpointAt: new Date().toISOString(),
          });
          return;
        }

        if (isDev) await new Promise((resolve) => setTimeout(resolve, 120));
      }

      await persistState(await verifyDownload(currentState, storedChunks));
    } catch (error) {
      const currentState = stateRef.current;
      if (!onlineRef.current && currentState) {
        await persistState({
          ...currentState,
          downloadStatus: 'paused',
          checkpoint: currentState.completedChunks.length,
          lastCheckpointAt: new Date().toISOString(),
        });
        return;
      }
      setErrorMessage(error.message || 'Download failed.');
      if (currentState) {
        await persistState({
          ...currentState,
          downloadStatus: 'failed',
          verificationStatus: 'failed',
          lastCheckpointAt: new Date().toISOString(),
        });
      }
    } finally {
      downloadingRef.current = false;
    }
  };

  const resumeWithLatestVersion = async (manualResume = false) => {
    const persistedState = await getLectureDownloadState(lectureId, initialVersionId);
    if (persistedState?.downloadStatus === 'completed' && persistedState.verificationStatus === 'verified') {
      stateRef.current = persistedState;
      setDownloadState(persistedState);
      return;
    }
    if (!onlineRef.current) {
      await pauseDownload();
      return;
    }
    if (manualResume) manuallyPausedRef.current = false;

    setErrorMessage(null);
    try {
      const response = await fetch(`/api/lectures/${encodeURIComponent(lectureId)}/latest-version`);
      const latestData = await response.json();
      if (!response.ok || !latestData.success) throw new Error(latestData.message || 'Could not check the latest lecture version.');

      const latest = latestData.latestVersion;
      const latestVersionName = latestData.currentVersion || getVersionName(latest.versionId);
      const existingStates = await getLectureDownloadStates(lectureId);
      const oldState = existingStates.find((state) => state.downloadStatus !== 'completed') || existingStates[0];
      const versionMismatch = Boolean(oldState && oldState.versionId !== latest.versionId);
      const localVersion = oldState?.localVersion || latestVersionName;

      if (versionMismatch && oldState) {
        await persistState({
          ...oldState,
          serverVersion: latestVersionName,
          latestVersion: latestVersionName,
          versionMismatch: true,
          downloadStatus: oldState.downloadStatus === 'completed' ? 'completed' : 'paused',
          lastCheckpointAt: new Date().toISOString(),
        });
      }

      const nextState = await prepareVersion({
        versionId: latest.versionId,
        versionName: latestVersionName,
        localVersion,
        versionMismatch,
      });
      await runDownload(nextState);
    } catch (error) {
      setErrorMessage(error.message || 'Could not resume the lecture download.');
    }
  };

  useEffect(() => {
    if (!lectureId || !initialVersionId) return undefined;
    let cancelled = false;

    const restoreCheckpoint = async () => {
      try {
        const savedStates = await getLectureDownloadStates(lectureId);
        const savedState = savedStates.find((state) => state.versionId === initialVersionId);
        if (!cancelled && savedState) {
          stateRef.current = savedState;
          setDownloadState(savedState);
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(error.message || 'Could not restore download checkpoint.');
      }
    };

    restoreCheckpoint();
    return () => {
      cancelled = true;
    };
  }, [lectureId, initialVersionId]);

  useEffect(() => {
    const handleOnline = () => {
      setBrowserOnline(true);
      if (stateRef.current?.downloadStatus === 'paused' && !manuallyPausedRef.current) {
        resumeWithLatestVersion();
      }
    };
    const handleOffline = () => {
      setBrowserOnline(false);
      pauseDownload();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lectureId]);

  if (!lectureId || !initialVersionId) return null;

  const progress = downloadState?.downloadProgress || 0;
  const isComplete = downloadState?.downloadStatus === 'completed'
    && downloadState?.verificationStatus === 'verified';
  const statusLabel = isComplete
    ? 'Available Offline'
    : downloadState?.downloadStatus === 'paused'
      ? 'Download Paused'
      : downloadState?.downloadStatus === 'downloading'
        ? 'Downloading'
        : downloadState?.downloadStatus === 'failed'
          ? 'Failed'
          : 'Not Started';

  return (
    <div className="lecture-download-panel" data-testid={`download-panel-${lectureId}`}>
      <div className="download-panel-header">
        <div>
          <strong>Offline Download</strong>
          <span className="download-version-label">{downloadState?.latestVersion || lecture.version || 'V1'}</span>
        </div>
        <span className={`download-network-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="download-progress-track" aria-label={`${progress}% downloaded`}>
        <div className="download-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="download-progress-meta">
        <span>{progress}%</span>
        <span>{downloadState?.completedChunks?.length || 0} / {downloadState?.totalChunks || '--'} chunks</span>
      </div>

      <div className="download-state-grid">
        <span>Status</span><strong>{statusLabel}</strong>
        <span>Checkpoint</span><strong>{downloadState?.checkpoint ?? '--'}</strong>
        <span>Verification</span><strong>{downloadState?.verificationStatus || 'pending'}</strong>
      </div>

      {downloadState?.versionMismatch && (
        <div className="download-warning"><AlertTriangle size={14} /> {downloadState.localVersion} was isolated; the latest {downloadState.latestVersion} download is separate.</div>
      )}
      {errorMessage && <div className="download-error">{errorMessage}</div>}
      {downloadState?.downloadStatus === 'paused' && <div className="download-checkpoint-saved">Checkpoint Saved / Download Paused</div>}
      {isComplete && <div className="download-verified"><CheckCircle2 size={14} /> Verified and Available Offline</div>}

      <div className="download-actions">
        {isComplete ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onWatchOffline?.(lecture)}
          >
            <Play size={15} /> Watch Offline
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={downloadState?.downloadStatus === 'downloading'
              ? () => pauseDownload(true)
              : () => resumeWithLatestVersion(true)}
            disabled={!isOnline && downloadState?.downloadStatus !== 'downloading'}
          >
            {downloadState?.downloadStatus === 'downloading' ? <Pause size={15} /> : <Download size={15} />}
            {downloadState?.downloadStatus === 'downloading' ? 'Pause Download' : 'Download / Resume'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LectureDownloadPanel;
