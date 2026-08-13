import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Monitor, Smartphone, Loader2, Sparkles } from 'lucide-react';

export default function DesktopPairing({ code, isLoading, error, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const formattedCode = code ? code.split('').join(' ') : '• • • • • •';

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
      <div className="pairing-card glass-panel">
        <div className="card-badge">
          <Monitor className="badge-icon" />
          <span>Computer Session</span>
        </div>

        <h2 className="pairing-headline">Transfer data without logging in</h2>
        <p className="pairing-subtext">
          Open <strong>Quicksand</strong> on your phone and enter this 6-digit code:
        </p>

        <div className="code-display-box">
          {isLoading ? (
            <div className="code-loading-state">
              <Loader2 className="animate-spin code-spinner" size={32} />
              <span>Generating Secure Code...</span>
            </div>
          ) : (
            <>
              <div className="code-digits">{formattedCode}</div>
              <button
                className={`copy-code-btn ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
                disabled={!code}
                title="Copy 6-digit code"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </>
          )}
        </div>

        <div className="pairing-status-indicator">
          <div className="pulse-ring"></div>
          <Smartphone className="phone-icon-pulse" />
          <span className="status-label">Waiting for your phone to connect...</span>
        </div>

        <div className="pairing-actions">
          <button
            className="toggle-qr-btn"
            onClick={() => setShowQR(!showQR)}
            disabled={!code}
          >
            <QrCode size={16} />
            <span>{showQR ? 'Hide QR Code' : 'Show Pairing QR'}</span>
          </button>

          {onRefresh && (
            <button className="refresh-code-btn" onClick={onRefresh}>
              <span>Generate New Code</span>
            </button>
          )}
        </div>

        {showQR && code && (
          <div className="qr-container fade-in">
            <div className="qr-wrapper">
              <QRCodeSVG value={mobileUrl} size={160} bgColor="#0f172a" fgColor="#38bdf8" />
            </div>
            <p className="qr-caption">Scan with phone camera to auto-fill code</p>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <div className="security-note">
          <Sparkles className="sec-icon" />
          <span>One-time secure session. Code automatically expires upon pairing. No account required.</span>
        </div>
      </div>
    </div>
  );
}
