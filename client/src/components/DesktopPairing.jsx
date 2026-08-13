import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Loader2, RefreshCw } from 'lucide-react';

export default function DesktopPairing({ code, isLoading, error, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Format code cleanly as "482 731"
  const formattedCode = code && code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code || '';

  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mobileUrl = typeof window !== 'undefined' ? `${window.location.origin}?code=${code}` : '';

  return (
    <div className="pairing-container desktop-pairing">
      <div className="pairing-card glass-panel compact-card">
        <h2 className="pairing-headline">One code. Anything. Anywhere.</h2>
        <p className="pairing-subtext">Open Quicksand on your phone and enter this code:</p>

        <div className="code-display-box minimal-box">
          {isLoading ? (
            <div className="code-loading-state">
              <Loader2 className="animate-spin code-spinner" size={28} />
              <span>Generating Code...</span>
            </div>
          ) : (
            <div className="code-digits-large">{formattedCode || '--- ---'}</div>
          )}
        </div>

        <div className="pairing-primary-actions">
          <button
            className={`copy-code-btn-primary ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard}
            disabled={!code || isLoading}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="pairing-status-indicator minimal-status">
          <span className="dot direct"></span>
          <span className="status-label">Waiting for phone...</span>
        </div>

        <div className="pairing-actions">
          <button
            className="toggle-qr-btn"
            onClick={() => setShowQR(!showQR)}
            disabled={!code || isLoading}
          >
            <QrCode size={16} />
            <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
          </button>
        </div>

        {showQR && code && (
          <div className="qr-container fade-in">
            <div className="qr-wrapper">
              <QRCodeSVG value={mobileUrl} size={150} bgColor="#0f172a" fgColor="#38bdf8" />
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner fade-in">
            <span>{error}</span>
            {onRefresh && (
              <button className="error-retry-btn" onClick={onRefresh}>
                <RefreshCw size={14} /> Retry
              </button>
            )}
          </div>
        )}

        <div className="security-note minimal-note">
          <span>No account • No storage • One-time session</span>
        </div>
      </div>
    </div>
  );
}
