import { sessionManager } from './sessionManager.js';

export function setupSignaling(io) {
  // Periodically clean up expired waiting sessions every 5 minutes
  setInterval(() => {
    sessionManager.cleanupStaleSessions();
  }, 5 * 60 * 1000);

  io.on('connection', (socket) => {
    // 1. Desktop requests a unique pairing code
    socket.on('create-desktop-session', (callback) => {
      try {
        const session = sessionManager.createSession(socket.id);
        callback({
          success: true,
          code: session.code,
          sessionId: session.sessionId,
        });
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    // 2. Mobile attempts to pair using 6-digit code
    socket.on('join-mobile-session', ({ code }, callback) => {
      const result = sessionManager.attemptJoinSession(code, socket.id);

      if (!result.success) {
        sessionManager.recordFailedAttempt(code);
        callback({ success: false, error: result.error });
        return;
      }

      const session = result.session;
      const desktopSocket = io.sockets.sockets.get(session.desktopSocketId);

      if (!desktopSocket) {
        sessionManager.destroySession(code);
        callback({ success: false, error: 'Computer session disconnected.' });
        return;
      }

      // Notify Mobile client pairing succeeded
      callback({
        success: true,
        sessionId: session.sessionId,
        peerSocketId: session.desktopSocketId,
      });

      // Notify Desktop client that Mobile device paired
      desktopSocket.emit('session-paired', {
        peerSocketId: socket.id,
        sessionId: session.sessionId,
      });
    });

    // 3. WebRTC Signal Relay (offer, answer, ice-candidate)
    socket.on('webrtc-signal', ({ targetSocketId, signal }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-signal', {
          senderSocketId: socket.id,
          signal,
        });
      }
    });

    // 4. Socket.IO Text Transfer Relay (Fallback/Instant)
    socket.on('relay-text', ({ targetSocketId, payload }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('relay-text', {
          senderSocketId: socket.id,
          payload,
        });
      }
    });

    // 5. In-Memory Socket.IO Chunked File Transfer Relay (Fallback mode)
    // Strictly in-memory forwarding without writing to disk or persistent storage.
    socket.on('relay-transfer-start', ({ targetSocketId, transferHeader }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('relay-transfer-start', {
          senderSocketId: socket.id,
          transferHeader,
        });
      }
    });

    socket.on('relay-chunk-data', ({ targetSocketId, transferId, chunkIndex, chunkData }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('relay-chunk-data', {
          senderSocketId: socket.id,
          transferId,
          chunkIndex,
          chunkData,
        });
      }
    });

    socket.on('relay-chunk-ack', ({ senderSocketId, transferId, chunkIndex }) => {
      if (senderSocketId) {
        io.to(senderSocketId).emit('relay-chunk-ack', {
          transferId,
          chunkIndex,
        });
      }
    });

    socket.on('relay-transfer-end', ({ targetSocketId, transferId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('relay-transfer-end', {
          senderSocketId: socket.id,
          transferId,
        });
      }
    });

    socket.on('relay-transfer-cancel', ({ targetSocketId, transferId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('relay-transfer-cancel', {
          transferId,
        });
      }
    });

    // 6. Handle Disconnection
    socket.on('disconnect', () => {
      const session = sessionManager.removeSocketSession(socket.id);
      if (session) {
        const peerId = session.desktopSocketId === socket.id ? session.mobileSocketId : session.desktopSocketId;
        if (peerId) {
          io.to(peerId).emit('peer-disconnected', {
            message: 'The paired device has disconnected.',
          });
        }
      }
    });
  });
}
