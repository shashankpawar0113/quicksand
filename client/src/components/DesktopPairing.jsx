import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

export default function DesktopPairing({ code, isLoading, error, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
    <div className="pairing-container screen-pairing">
      {/* Central Glass Orb Display */}
      <div className="pearl-orb-container">
        <div className="pearl-orb-outer">
          <div className="pearl-orb-inner">
            {isLoading ? (
              <div className="orb-loading-state">
                <Loader2 className="animate-spin orb-spinner" size={32} />
                <span className="orb-sublabel">Generating Code...</span>
              </div>
            ) : (
              <div className="orb-code-content">
                <span className="orb-top-label">Connection Code</span>
                <h2 className="orb-code-digits">{formattedCode || '--- ---'}</h2>
                <span className="orb-sublabel">Enter on phone</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons below Orb */}
      <div className="orb-action-buttons">
        <button
          className={`pill-action-btn ${copied ? 'copied' : ''}`}
          onClick={copyToClipboard}
          disabled={!code || isLoading}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
          <ArrowRight size={16} className="btn-arrow" />
        </button>

        <button
          className="pill-secondary-btn"
          onClick={() => setShowQR(!showQR)}
          disabled={!code || isLoading}
        >
          <QrCode size={16} />
          <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
        </button>
      </div>

      {showQR && code && (
        <div className="qr-container-screen fade-in">
          <div className="qr-wrapper-screen">
            <QRCodeSVG value={mobileUrl} size={150} bgColor="#ffffff" fgColor="#161616" />
          </div>
          <p className="qr-caption-screen">Scan with phone camera to auto-fill code</p>
        </div>
      )}

      {error && (
        <div className="error-banner-screen fade-in">
          <span>{error}</span>
          {onRefresh && (
            <button className="retry-btn-screen" onClick={onRefresh}>
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      )}

      {/* Footer message matching screen.png */}
      <footer className="screen-pairing-footer">
        <p>Instantly pair devices with a one-time 6-digit code.</p>
      </footer>
    </div>
  );
}
