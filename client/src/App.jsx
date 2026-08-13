import React, { useState, useEffect, useRef } from 'react';
import StatusHeader from './components/StatusHeader';
import DesktopPairing from './components/DesktopPairing';
import MobilePairing from './components/MobilePairing';
import TransferWorkspace from './components/TransferWorkspace';
import { socketService } from './modules/socket';
import { WebRTCManager } from './modules/webrtcManager';
import { TransferEngine } from './modules/transferEngine';
import { Monitor, Smartphone, RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [deviceRole, setDeviceRole] = useState('desktop'); // 'desktop' | 'mobile'
  const [sessionCode, setSessionCode] = useState('');
  const [peerSocketId, setPeerSocketId] = useState('');
  const [connectionState, setConnectionState] = useState(null); // null | 'connecting' | 'connected' | 'relayed' | 'disconnected'
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState('');

  const [transfers, setTransfers] = useState(new Map());
  const [receivedTexts, setReceivedTexts] = useState([]);

  const webrtcManagerRef = useRef(null);
  const transferEngineRef = useRef(null);

  // Parse URL query parameter ?code=XXXXXX for auto-fill on mobile
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialCodeFromUrl = urlParams ? urlParams.get('code') : '';

  useEffect(() => {
    // Detect mobile browser from User Agent
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileUA || initialCodeFromUrl) {
      setDeviceRole('mobile');
    }
  }, []);

  // Initialize Desktop Session
  useEffect(() => {
    if (deviceRole === 'desktop' && !sessionCode && !connectionState) {
      initDesktopSession();
    }
  }, [deviceRole]);

  const initDesktopSession = async () => {
    setIsPairingLoading(true);
    setPairingError('');
    try {
      const response = await socketService.createDesktopSession();
      setSessionCode(response.code);

      // Listen for mobile device pairing
      const socket = socketService.getSocket();
      socket.off('session-paired');
      socket.on('session-paired', ({ peerSocketId: mobilePeerId }) => {
        setPeerSocketId(mobilePeerId);
        startConnection(mobilePeerId, true);
      });

      socket.off('peer-disconnected');
      socket.on('peer-disconnected', () => {
        handlePeerDisconnect();
      });
    } catch (err) {
      setPairingError(err.message || 'Failed to initialize session.');
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handleMobileConnect = async (code) => {
    setIsPairingLoading(true);
    setPairingError('');
    try {
      const response = await socketService.joinMobileSession(code);
      setSessionCode(code);
      setPeerSocketId(response.peerSocketId);

      const socket = socketService.getSocket();
      socket.off('peer-disconnected');
      socket.on('peer-disconnected', () => {
        handlePeerDisconnect();
      });

      startConnection(response.peerSocketId, false);
    } catch (err) {
      setPairingError(err.message || 'Failed to connect. Check pairing code.');
    } finally {
      setIsPairingLoading(false);
    }
  };

  const startConnection = (peerId, isInitiator) => {
    setConnectionState('connecting');

    // Create WebRTC Manager
    const webrtc = new WebRTCManager({
      peerSocketId: peerId,
      isInitiator,
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
      onDataMessage: (data) => {
        if (transferEngineRef.current) {
          transferEngineRef.current.handleDataMessage(data);
        }
      },
    });

    webrtcManagerRef.current = webrtc;

    // Create Transfer Engine
    const transferEngine = new TransferEngine({
      webrtcManager: webrtc,
      peerSocketId: peerId,
      onTransferUpdate: (updatedState) => {
        setTransfers((prev) => {
          const next = new Map(prev);
          next.set(updatedState.id, updatedState);
          return next;
        });
      },
      onTextReceived: (textPayload) => {
        setReceivedTexts((prev) => [...prev, textPayload]);
      },
    });

    transferEngineRef.current = transferEngine;

    // Listen for WebRTC signals from peer
    const socket = socketService.getSocket();
    socket.off('webrtc-signal');
    socket.on('webrtc-signal', ({ signal }) => {
      webrtc.handleSignal(signal);
    });

    webrtc.init();
  };

  const handlePeerDisconnect = () => {
    setConnectionState('disconnected');
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.close();
      webrtcManagerRef.current = null;
    }
    transferEngineRef.current = null;
  };

  const handleManualDisconnect = () => {
    socketService.disconnect();
    setConnectionState(null);
    setSessionCode('');
    setPeerSocketId('');
    setTransfers(new Map());
    setReceivedTexts([]);
    if (deviceRole === 'desktop') {
      initDesktopSession();
    }
  };

  const handleSendFiles = (files) => {
    if (!transferEngineRef.current) return;
    files.forEach((file) => {
      transferEngineRef.current.sendFile(file);
    });
  };

  const handleSendText = (text) => {
    if (!transferEngineRef.current) return;
    const payload = transferEngineRef.current.sendText(text);
    setReceivedTexts((prev) => [...prev, payload]);
  };

  const handleCancelTransfer = (transferId) => {
    if (transferEngineRef.current) {
      transferEngineRef.current.cancelTransfer(transferId);
    }
  };

  const isConnected = connectionState === 'connected' || connectionState === 'relayed';

  return (
    <div className="app-layout">
      {/* Top Header */}
      <StatusHeader
        connectionState={connectionState}
        onDisconnect={isConnected ? handleManualDisconnect : null}
        sessionCode={sessionCode}
      />

      {/* Main Container */}
      <main className="app-main">
        {!isConnected && connectionState !== 'connecting' && (
          <div className="role-switch-container">
            <div className="role-switch-pill">
              <button
                className={`role-btn ${deviceRole === 'desktop' ? 'active' : ''}`}
                onClick={() => {
                  setDeviceRole('desktop');
                  setSessionCode('');
                }}
              >
                <Monitor size={16} />
                <span>Computer View</span>
              </button>
              <button
                className={`role-btn ${deviceRole === 'mobile' ? 'active' : ''}`}
                onClick={() => {
                  setDeviceRole('mobile');
                  setSessionCode('');
                }}
              >
                <Smartphone size={16} />
                <span>Phone View</span>
              </button>
            </div>
          </div>
        )}

        {/* Views */}
        {!isConnected && connectionState !== 'connecting' && (
          <>
            {deviceRole === 'desktop' ? (
              <DesktopPairing
                code={sessionCode}
                isLoading={isPairingLoading}
                error={pairingError}
                onRefresh={initDesktopSession}
                onClearError={() => setPairingError('')}
              />
            ) : (
              <MobilePairing
                onConnect={handleMobileConnect}
                isLoading={isPairingLoading}
                error={pairingError}
                initialCode={initialCodeFromUrl}
                onClearError={() => setPairingError('')}
              />
            )}
          </>
        )}

        {connectionState === 'connecting' && (
          <div className="connecting-view-card glass-panel fade-in">
            <div className="connecting-spinner">
              <RefreshCw className="animate-spin" size={40} />
            </div>
            <h2>Establishing Connection...</h2>
            <p>Pairing devices securely via P2P signal exchange.</p>
          </div>
        )}

        {isConnected && (
          <TransferWorkspace
            transfers={transfers}
            receivedTexts={receivedTexts}
            onSendFiles={handleSendFiles}
            onSendText={handleSendText}
            onCancelTransfer={handleCancelTransfer}
          />
        )}

        {connectionState === 'disconnected' && (
          <div className="disconnected-card glass-panel fade-in">
            <AlertTriangle size={36} className="warn-icon" />
            <h2>Connection Ended</h2>
            <p>The paired device disconnected or the session expired.</p>
            <button className="new-session-btn" onClick={handleManualDisconnect}>
              Start New Connection
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
