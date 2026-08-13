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
  File as FileIcon,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Code2,
  ExternalLink,
  Sparkles,
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
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mimeType?.startsWith('image/')) {
      return <ImageIcon className="file-type-icon image" size={24} />;
    }
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext) || mimeType?.startsWith('video/')) {
      return <Video className="file-type-icon video" size={24} />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext) || mimeType?.startsWith('audio/')) {
      return <Music className="file-type-icon audio" size={24} />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <Archive className="file-type-icon archive" size={24} />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext)) {
      return <Code2 className="file-type-icon code" size={24} />;
    }
    return <FileIcon className="file-type-icon default" size={24} />;
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

  // Copy text helper
  const copyTextToClipboard = (id, text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
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
      e.target.value = '';
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
    <div className="workspace-container fade-in">
      {/* Workspace Navigation Tabs */}
      <div className="workspace-tabs-row">
        <button
          className={`workspace-tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <UploadCloud size={18} />
          <span>Files & Media</span>
          {transferList.length > 0 && <span className="tab-badge">{transferList.length}</span>}
        </button>

        <button
          className={`workspace-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <FileText size={18} />
          <span>Text & Links</span>
          {receivedTexts.length > 0 && <span className="tab-badge">{receivedTexts.length}</span>}
        </button>
      </div>

      {/* Tab Content: FILES & MEDIA */}
      {activeTab === 'files' && (
        <div className="workspace-tab-content files-tab">
          {/* Dropzone Card */}
          <div
            className={`dropzone-card ${isDragOver ? 'drag-over' : ''}`}
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
            <div className="dropzone-icon-wrapper">
              <UploadCloud size={36} className="dropzone-cloud-icon" />
            </div>
            <h3 className="dropzone-main-title">Drop anything here to send instantly</h3>
            <p className="dropzone-sub-description">
              Supports photos, 4K videos, documents, zips, & raw binaries with <strong>zero quality loss</strong>.
            </p>
            <div className="dropzone-buttons-row">
              <button className="pill-action-btn browse-files-btn" type="button">
                <span>Choose Files</span>
              </button>

              <button
                className="pill-secondary-btn sample-file-btn"
                type="button"
                id="mock-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendFiles([
                    new window.File(
                      ['Quicksand Instant Transfer Demo Content - SHA256 Verified Byte-Perfect Transfer'],
                      'quicksand_sample_demo.txt',
                      { type: 'text/plain' }
                    ),
                  ]);
                }}
              >
                <Sparkles size={14} />
                <span>Send Sample File</span>
              </button>
            </div>
          </div>

          {/* Transfer Queue Section */}
          {transferList.length > 0 && (
            <div className="transfer-queue-section">
              <div className="queue-section-header">
                <h3>Transfers Queue</h3>
                <span className="quality-pill">
                  <ShieldCheck size={14} /> Byte-Perfect / Original Quality
                </span>
              </div>

              <div className="transfer-list-stack">
                {transferList.map((item) => (
                  <div key={item.id} className={`transfer-item-card status-${item.status}`}>
                    <div className="transfer-item-main-row">
                      <div className="file-info-cell">
                        <div className="file-icon-badge">{getFileIcon(item.name, item.mimeType)}</div>
                        <div className="file-meta-col">
                          <h4 className="file-title-name" title={item.name}>
                            {item.name}
                          </h4>
                          <span className="file-size-direction">
                            {formatBytes(item.size)} • {item.direction === 'outgoing' ? 'Sending' : 'Receiving'}
                          </span>
                        </div>
                      </div>

                      <div className="file-action-cell">
                        {item.status === 'completed' && item.fileUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(item)}
                            className="download-save-btn"
                            title={`Download ${item.name}`}
                          >
                            <Download size={16} />
                            <span>Save {item.name ? item.name.split('.').pop().toUpperCase() : 'File'}</span>
                          </button>
                        )}

                        {item.status === 'transferring' && (
                          <button
                            className="cancel-transfer-btn"
                            onClick={() => onCancelTransfer(item.id)}
                            title="Cancel transfer"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Media Preview Box */}
                    {item.status === 'completed' && item.fileUrl && (
                      <div className="media-preview-box">
                        {isImageFile(item.name, item.mimeType) && (
                          <img
                            src={item.fileUrl}
                            alt={item.name}
                            className="media-preview-image"
                            onClick={() => handleDownloadFile(item)}
                            title="Click to download photo"
                          />
                        )}
                        {isVideoFile(item.name, item.mimeType) && (
                          <video
                            src={item.fileUrl}
                            controls
                            className="media-preview-video"
                            preload="metadata"
                          />
                        )}
                      </div>
                    )}

                    {/* Progress Track */}
                    <div className="progress-track-block">
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${item.progressPercent || 0}%` }}
                        ></div>
                      </div>

                      <div className="progress-info-row">
                        <div className="status-label-left">
                          {item.status === 'transferring' && (
                            <>
                              <span className="pct-val">{item.progressPercent}%</span>
                              <span className="speed-val">• {formatSpeed(item.speedBps)}</span>
                              {item.etaSeconds > 0 && (
                                <span className="eta-val">
                                  <Clock size={12} /> {item.etaSeconds}s
                                </span>
                              )}
                            </>
                          )}

                          {item.status === 'verifying' && (
                            <span className="verifying-text">
                              <Zap className="spin" size={14} /> Verifying SHA-256 integrity...
                            </span>
                          )}

                          {item.status === 'completed' && (
                            <span className="completed-text">
                              <ShieldCheck size={14} className="check-icon-green" />
                              {item.sha256Verified ? '✓ SHA-256 Verified' : 'Transfer Completed'}
                            </span>
                          )}

                          {item.status === 'cancelled' && (
                            <span className="cancelled-text">Transfer Cancelled</span>
                          )}

                          {item.status === 'failed' && <span className="failed-text">Transfer Failed</span>}
                        </div>

                        <span className="bytes-ratio">
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
        <div className="workspace-tab-content text-tab">
          {/* Form Card */}
          <form onSubmit={handleTextSubmit} className="text-share-card">
            <textarea
              className="text-share-textarea"
              rows={4}
              placeholder="Paste a link, note, snippet, or URL here to send instantly..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            ></textarea>

            <div className="text-share-actions-row">
              <span className="text-tip-label">
                <Sparkles size={14} /> Transfers instantly to paired device clipboard
              </span>
              <button type="submit" className="pill-action-btn send-text-primary-btn" disabled={!textInput.trim()}>
                <Send size={16} />
                <span>Send Text / Link</span>
              </button>
            </div>
          </form>

          {/* History Cards */}
          <div className="received-texts-history">
            <h3 className="history-section-title">Transfer History</h3>
            {receivedTexts.length === 0 ? (
              <div className="empty-texts-card">
                <FileText size={32} className="empty-text-icon" />
                <p>No text or links sent yet. Paste anything above to transfer.</p>
              </div>
            ) : (
              <div className="text-cards-stack">
                {receivedTexts.slice().reverse().map((item) => (
                  <div key={item.id} className="text-card-item">
                    <div className="text-card-main-content">
                      {isUrl(item.text) ? (
                        <a
                          href={item.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-card-url"
                        >
                          <LinkIcon size={16} className="url-link-icon" />
                          <span className="url-text-truncate">{item.text}</span>
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <p className="text-card-body-str">{item.text}</p>
                      )}
                      <span className="text-card-timestamp">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <button
                      className={`copy-text-action-btn ${copiedId === item.id ? 'copied' : ''}`}
                      onClick={() => copyTextToClipboard(item.id, item.text)}
                      title="Copy to clipboard"
                    >
                      {copiedId === item.id ? <Check size={15} /> : <Copy size={15} />}
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
