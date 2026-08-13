import React from 'react';
import { Zap, Wifi, ShieldCheck, LogOut, ArrowRightLeft } from 'lucide-react';

export default function StatusHeader({ connectionState, onDisconnect, sessionCode }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <Zap className="logo-icon" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">Quicksand</h1>
          <span className="brand-subtitle">Instant Phone ↔ Computer Transfer</span>
        </div>
      </div>

      {connectionState && (
        <div className="header-status">
          <div className={`status-badge ${connectionState}`}>
            {connectionState === 'connected' && (
              <>
                <span className="dot direct"></span>
                <Wifi className="badge-icon" />
                <span>Direct P2P</span>
              </>
            )}
            {connectionState === 'relayed' && (
              <>
                <span className="dot relay"></span>
                <ArrowRightLeft className="badge-icon" />
                <span>Relayed Connection</span>
              </>
            )}
            {connectionState === 'connecting' && (
              <>
                <span className="dot connecting"></span>
                <span>Connecting...</span>
              </>
            )}
          </div>

          {sessionCode && (
            <div className="session-code-pill">
              <span className="pill-label">Code:</span>
              <span className="pill-val">{sessionCode}</span>
            </div>
          )}

          {onDisconnect && (
            <button className="disconnect-btn" onClick={onDisconnect} title="End Connection">
              <LogOut size={16} />
              <span className="btn-text">Disconnect</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
