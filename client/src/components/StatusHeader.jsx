import React, { useState } from 'react';
import { Wifi, ArrowRightLeft, LogOut, HelpCircle, Radio, X } from 'lucide-react';

export default function StatusHeader({ connectionState, onDisconnect, sessionCode }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="app-header-screen">
      <div className="header-top-row">
        <div className="header-left">
          <div className="q-logo-circle">
            <img src="/logo.jpeg" alt="Quicksand Logo" className="q-logo-img" />
          </div>
        </div>

        <div className="header-center">
          <h1 className="brand-title-screen">Quicksand</h1>
        </div>

        <div className="header-right">
          <button
            className="help-icon-btn"
            onClick={() => setShowHelp(!showHelp)}
            title="How Quicksand works"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      {/* Online Status Bar */}
      <div className="status-sub-row">
        <div className="you-status-badge">
          <div className="signal-icon-circle">
            <Radio size={20} className="radio-icon" />
          </div>
          <div className="status-text-meta">
            <span className="user-name">You</span>
            <span className="online-indicator">
              <span className="online-dot"></span>
              {connectionState === 'connected'
                ? 'Direct P2P Connected'
                : connectionState === 'relayed'
                ? 'Relayed Connection'
                : connectionState === 'connecting'
                ? 'Connecting...'
                : 'Online'}
            </span>
          </div>
        </div>

        {connectionState && onDisconnect && (
          <button className="disconnect-btn-screen" onClick={onDisconnect} title="End Connection">
            <LogOut size={16} />
            <span>End Session</span>
          </button>
        )}
      </div>

      {/* Help Modal Popup */}
      {showHelp && (
        <div className="help-modal-overlay fade-in" onClick={() => setShowHelp(false)}>
          <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>About Quicksand</h3>
              <button className="close-modal-btn" onClick={() => setShowHelp(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>⚡ <strong>Zero Friction:</strong> No account creation, login, passwords, or app installation required.</p>
              <p>🔒 <strong>Cryptographic 1-Time Code:</strong> Every session gets a unique 6-digit code destroyed immediately upon pairing.</p>
              <p>🚀 <strong>Direct P2P & No Compression:</strong> Files transfer exact byte-for-byte directly between devices with SHA-256 verification.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
