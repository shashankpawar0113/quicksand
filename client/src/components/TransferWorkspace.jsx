import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Copy,
  Check,
  Download,
  XCircle,
  ShieldCheck,
  Clock,
  Zap,
  Send,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Code2,
} from 'lucide-react';

export default function TransferWorkspace({
  transfers,
  receivedTexts,
  onSendFiles,
  onSendText,
  onCancelTransfer,
}) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'text'
  const [textInput, setTextInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // File type icon resolver
  const getFileIcon = (fileName, mimeType) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mimeType?.startsWith('image/')) {
      return <ImageIcon className="file-type-icon image" />;
    }
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext) || mimeType?.startsWith('video/')) {
      return <Video className="file-type-icon video" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext) || mimeType?.startsWith('audio/')) {
      return <Music className="file-type-icon audio" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <Archive className="file-type-icon archive" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext)) {
      return <Code2 className="file-type-icon code" />;
    }
    return <File className="file-type-icon default" />;
  };

  // Format bytes to human readable string
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format speed (bytes/sec) to human readable string
  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
    return `${formatBytes(bytesPerSec)}/s`;
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSendFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onSendFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSendText(textInput.trim());
      setTextInput('');
    }
  };

  const handleDownloadFile = (item) => {
    if (!item.fileUrl) return;
    const fileName = item.name || 'quicksand_file';
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = item.fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 100);
  };

  const isImageFile = (fileName, mimeType) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mimeType?.startsWith('image/');
  };

  const isVideoFile = (fileName, mimeType) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext) || mimeType?.startsWith('video/');
  };

  // Detect URL
  const isUrl = (text) => {
    try {
      new URL(text);
      return true;
    } catch (_) {
      return false;
    }
  };

  const transferList = Array.from(transfers.values()).reverse();

  return (
    <div className="workspace-container">
      {/* Workspace Navigation Tabs */}
      <div className="workspace-tabs">
        <button
          className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <UploadCloud size={18} />
          <span>Files & Media</span>
          {transferList.length > 0 && <span className="tab-count">{transferList.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <FileText size={18} />
          <span>Text & Links</span>
          {receivedTexts.length > 0 && <span className="tab-count">{receivedTexts.length}</span>}
        </button>
      </div>

      {/* Tab Content: FILES & MEDIA */}
      {activeTab === 'files' && (
        <div className="workspace-content files-tab">
          {/* Dropzone */}
          <div
            className={`dropzone glass-panel ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden-file-input"
              onChange={handleFileSelect}
            />
            <div className="dropzone-illustration">
              <UploadCloud className="upload-icon" />
            </div>
            <h3 className="dropzone-title">Drop anything here to send instantly</h3>
            <p className="dropzone-subtext">
              Supports photos, 4K videos, documents, zips, & raw binaries with <strong>zero quality loss</strong>.
            </p>
            <button className="browse-files-btn" type="button">
              Choose Files
            </button>
          </div>

          {/* Transfer Queue */}
          {transferList.length > 0 && (
            <div className="transfer-queue-section">
              <div className="queue-header">
                <h3>Transfers</h3>
                <span className="quality-pill">
                  <ShieldCheck size={14} /> Byte-Perfect / Original Quality
                </span>
              </div>

              <div className="transfer-list">
                {transferList.map((item) => (
                  <div key={item.id} className={`transfer-card glass-panel status-${item.status}`}>
                    <div className="transfer-card-header">
                      <div className="file-info-col">
                        {getFileIcon(item.name, item.mimeType)}
                        <div className="file-name-meta">
                          <h4 className="file-name" title={item.name}>
                            {item.name}
                          </h4>
                          <span className="file-size-dir">
                            {formatBytes(item.size)} • {item.direction === 'outgoing' ? 'Sending' : 'Receiving'}
                          </span>
                        </div>
                      </div>

                      <div className="transfer-actions-col">
                        {item.status === 'completed' && item.fileUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(item)}
                            className="download-btn"
                            title={`Download ${item.name}`}
                          >
                            <Download size={16} />
                            <span>Save {item.name ? item.name.split('.').pop().toUpperCase() : 'File'}</span>
                          </button>
                        )}

                        {item.status === 'transferring' && (
                          <button
                            className="cancel-btn"
                            onClick={() => onCancelTransfer(item.id)}
                            title="Cancel transfer"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Media Preview Box (Images & Videos) */}
                    {item.status === 'completed' && item.fileUrl && (
                      <div className="media-preview-container">
                        {isImageFile(item.name, item.mimeType) && (
                          <div className="image-preview-wrapper">
                            <img
                              src={item.fileUrl}
                              alt={item.name}
                              className="received-preview-img"
                              onClick={() => handleDownloadFile(item)}
                              title="Click to download original photo"
                            />
                          </div>
                        )}
                        {isVideoFile(item.name, item.mimeType) && (
                          <div className="video-preview-wrapper">
                            <video
                              src={item.fileUrl}
                              controls
                              className="received-preview-video"
                              preload="metadata"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress Bar & Realtime Metrics */}
                    <div className="progress-section">
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${item.progressPercent || 0}%` }}
                        ></div>
                      </div>

                      <div className="progress-metrics-row">
                        <div className="metrics-left">
                          {item.status === 'transferring' && (
                            <>
                              <span className="metric-pct">{item.progressPercent}%</span>
                              <span className="metric-speed">• {formatSpeed(item.speedBps)}</span>
                              {item.etaSeconds > 0 && (
                                <span className="metric-eta">
                                  <Clock size={12} /> ETA: {item.etaSeconds}s
                                </span>
                              )}
                            </>
                          )}

                          {item.status === 'verifying' && (
                            <span className="verifying-badge">
                              <Zap className="spin" size={14} /> Verifying SHA-256 integrity...
                            </span>
                          )}

                          {item.status === 'completed' && (
                            <span className="completed-badge">
                              <ShieldCheck size={14} className="check-green" />
                              {item.sha256Verified ? '✓ SHA-256 Verified' : 'Transfer Completed'}
                            </span>
                          )}

                          {item.status === 'cancelled' && (
                            <span className="cancelled-badge">Transfer Cancelled</span>
                          )}

                          {item.status === 'failed' && (
                            <span className="failed-badge">Transfer Failed</span>
                          )}
                        </div>

                        <span className="metric-bytes">
                          {formatBytes(item.direction === 'outgoing' ? item.bytesSent : item.bytesReceived)} / {formatBytes(item.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: TEXT & LINKS */}
      {activeTab === 'text' && (
        <div className="workspace-content text-tab">
          <form onSubmit={handleTextSubmit} className="text-send-form glass-panel">
            <textarea
              className="text-input-area"
              rows={4}
              placeholder="Paste a link, note, snippet, or URL here to send instantly..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            ></textarea>
            <div className="form-bottom-row">
              <span className="form-tip">Transfers instantly to paired device clipboard / view</span>
              <button type="submit" className="send-text-btn" disabled={!textInput.trim()}>
                <Send size={16} />
                <span>Send Text</span>
              </button>
            </div>
          </form>

          <div className="received-texts-section">
            <h3 className="section-title">Transfer History</h3>
            {receivedTexts.length === 0 ? (
              <div className="empty-history glass-panel">
                <FileText size={32} className="empty-icon" />
                <p>No text or links sent yet. Paste anything above to transfer.</p>
              </div>
            ) : (
              <div className="text-cards-list">
                {receivedTexts.slice().reverse().map((item) => (
                  <div key={item.id} className="text-item-card glass-panel">
                    <div className="text-card-content">
                      {isUrl(item.text) ? (
                        <a
                          href={item.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-url-link"
                        >
                          <LinkIcon size={16} className="url-icon" />
                          <span>{item.text}</span>
                        </a>
                      ) : (
                        <p className="text-body">{item.text}</p>
                      )}
                      <span className="text-time">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <button
                      className={`copy-text-btn ${copiedId === item.id ? 'copied' : ''}`}
                      onClick={() => copyTextToClipboard(item.id, item.text)}
                      title="Copy to clipboard"
                    >
                      {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
