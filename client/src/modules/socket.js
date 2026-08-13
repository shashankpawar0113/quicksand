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

  ensureConnected() {
    return new Promise((resolve) => {
      const socket = this.getSocket();
      if (socket.connected) {
        resolve(socket);
      } else {
        const timer = setTimeout(() => {
          resolve(socket);
        }, 5000);

        socket.once('connect', () => {
          clearTimeout(timer);
          resolve(socket);
        });
      }
    });
  }

  createDesktopSession() {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Connection timed out. Server taking longer to respond. Click "Generate New Code" to retry.'));
      }, 8000);

      try {
        const socket = await this.ensureConnected();
        socket.emit('create-desktop-session', (response) => {
          clearTimeout(timer);
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to generate pairing code.'));
          }
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  joinMobileSession(code) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Connection timed out. Please check network connection and try again.'));
      }, 8000);

      try {
        const socket = await this.ensureConnected();
        socket.emit('join-mobile-session', { code }, (response) => {
          clearTimeout(timer);
          if (response && response.success) {
            this.peerSocketId = response.peerSocketId;
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to connect.'));
          }
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  sendSignal(targetSocketId, signal) {
    const socket = this.getSocket();
    socket.emit('webrtc-signal', { targetSocketId, signal });
  }
}

export const socketService = new SocketService();
