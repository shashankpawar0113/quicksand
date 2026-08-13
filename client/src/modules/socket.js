import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.peerSocketId = null;
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.peerSocketId = null;
    }
  }

  createDesktopSession() {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('create-desktop-session', (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to generate pairing code.'));
        }
      });
    });
  }

  joinMobileSession(code) {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('join-mobile-session', { code }, (response) => {
        if (response.success) {
          this.peerSocketId = response.peerSocketId;
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to connect.'));
        }
      });
    });
  }

  sendSignal(targetSocketId, signal) {
    const socket = this.getSocket();
    socket.emit('webrtc-signal', { targetSocketId, signal });
  }
}

export const socketService = new SocketService();
