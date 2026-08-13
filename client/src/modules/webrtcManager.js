import { socketService } from './socket.js';

export class WebRTCManager {
  constructor({ peerSocketId, isInitiator, onConnectionStateChange, onDataMessage }) {
    this.peerSocketId = peerSocketId;
    this.isInitiator = isInitiator;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onDataMessage = onDataMessage;

    this.peerConnection = null;
    this.dataChannel = null;
    this.connectionState = 'connecting'; // 'connecting' | 'connected' | 'relayed' | 'disconnected'
    this.connectionTimeoutTimer = null;

    // Public STUN configuration
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ],
    };
  }

  init() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // ICE Candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendSignal(this.peerSocketId, {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    // Monitor Connection State
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        this.clearFallbackTimer();
        this.updateState('connected');
      } else if (state === 'failed' || state === 'closed') {
        this.handleWebRTCFailure();
      }
    };

    if (this.isInitiator) {
      // Create DataChannel as Initiator (Desktop)
      this.dataChannel = this.peerConnection.createDataChannel('quicksand-transfer', {
        ordered: true,
      });
      this.setupDataChannel(this.dataChannel);

      // Create Offer
      this.peerConnection
        .createOffer()
        .then((offer) => this.peerConnection.setLocalDescription(offer))
        .then(() => {
          socketService.sendSignal(this.peerSocketId, {
            type: 'offer',
            sdp: this.peerConnection.localDescription,
          });
        })
        .catch((err) => {
          console.error('WebRTC offer error:', err);
          this.handleWebRTCFailure();
        });
    } else {
      // Listen for incoming DataChannel as Receiver (Mobile)
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }

    // Set a 6-second timer to fallback to Socket.IO relay if WebRTC direct channel isn't established quickly
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.connectionState === 'connecting') {
        console.warn('WebRTC P2P direct connection timeout. Switching to Socket.IO relay fallback.');
        this.handleWebRTCFailure();
      }
    }, 6000);
  }

  setupDataChannel(channel) {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.clearFallbackTimer();
      this.updateState('connected');
    };

    channel.onmessage = (event) => {
      if (this.onDataMessage) {
        this.onDataMessage(event.data);
      }
    };

    channel.onclose = () => {
      if (this.connectionState === 'connected') {
        this.updateState('disconnected');
      }
    };

    channel.onerror = (error) => {
      console.error('DataChannel error:', error);
    };
  }

  handleSignal(signal) {
    if (!this.peerConnection) return;

    if (signal.type === 'offer') {
      this.peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => this.peerConnection.createAnswer())
        .then((answer) => this.peerConnection.setLocalDescription(answer))
        .then(() => {
          socketService.sendSignal(this.peerSocketId, {
            type: 'answer',
            sdp: this.peerConnection.localDescription,
          });
        })
        .catch((err) => {
          console.error('WebRTC answer error:', err);
          this.handleWebRTCFailure();
        });
    } else if (signal.type === 'answer') {
      this.peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .catch((err) => {
          console.error('WebRTC remote description error:', err);
          this.handleWebRTCFailure();
        });
    } else if (signal.type === 'candidate' && signal.candidate) {
      this.peerConnection
        .addIceCandidate(new RTCIceCandidate(signal.candidate))
        .catch((err) => console.error('Error adding ICE candidate:', err));
    }
  }

  handleWebRTCFailure() {
    if (this.connectionState !== 'relayed' && this.connectionState !== 'disconnected') {
      this.clearFallbackTimer();
      this.updateState('relayed');
    }
  }

  clearFallbackTimer() {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  updateState(newState) {
    this.connectionState = newState;
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(newState);
    }
  }

  sendData(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
      return true;
    }
    return false;
  }

  getBufferedAmount() {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      return this.dataChannel.bufferedAmount;
    }
    return 0;
  }

  close() {
    this.clearFallbackTimer();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.updateState('disconnected');
  }
}
