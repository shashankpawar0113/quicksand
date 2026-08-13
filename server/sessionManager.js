import crypto from 'crypto';

class SessionManager {
  constructor() {
    this.sessions = new Map(); // code -> session object
    this.socketToSession = new Map(); // socketId -> code
    this.usedCodes = new Set(); // Tracks all historically used/consumed codes during server lifetime
  }

  /**
   * Generates a cryptographically random 6-digit code (100000 - 999999)
   * guaranteed to be unique and never used before in this server run.
   */
  generateUniqueCode() {
    let attempts = 0;
    while (attempts < 10000) {
      // Generate 6-digit random integer
      const num = crypto.randomInt(100000, 1000000).toString();
      if (!this.sessions.has(num) && !this.usedCodes.has(num)) {
        return num;
      }
      attempts++;
    }
    throw new Error('Unable to generate unique pairing code. Server code namespace exhausted.');
  }

  /**
   * Creates a new temporary pairing session for a Desktop client.
   */
  createSession(desktopSocketId) {
    // If socket already had a session, clean it up
    this.removeSocketSession(desktopSocketId);

    const code = this.generateUniqueCode();
    const sessionId = crypto.randomUUID();

    const session = {
      code,
      sessionId,
      desktopSocketId,
      mobileSocketId: null,
      state: 'waiting', // 'waiting' | 'connecting' | 'connected'
      createdAt: Date.now(),
      failedAttempts: 0,
      lastAttemptAt: 0,
    };

    this.sessions.set(code, session);
    this.socketToSession.set(desktopSocketId, code);

    return session;
  }

  /**
   * Validates and pairs a Mobile client using a 6-digit code.
   * Implements progressive session-code cooldown to prevent brute force
   * without affecting other users sharing the same public IP.
   */
  attemptJoinSession(code, mobileSocketId) {
    const session = this.sessions.get(code);

    if (!session) {
      if (this.usedCodes.has(code)) {
        return { success: false, error: 'This connection code has already been used and expired.' };
      }
      return { success: false, error: 'Invalid connection code. Please check the 6 digits on your computer.' };
    }

    if (session.state === 'connected' || session.mobileSocketId) {
      return { success: false, error: 'This connection code is already paired with another device.' };
    }

    // Rate limiting check: progressive cooldown per session code
    const now = Date.now();
    if (session.failedAttempts > 0) {
      const cooldownMs = Math.min(session.failedAttempts * 1500, 5000); // 1.5s, 3s, 4.5s, max 5s
      const elapsed = now - session.lastAttemptAt;
      if (elapsed < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
        return {
          success: false,
          error: `Too many failed attempts. Please wait ${remainingSec} second${remainingSec > 1 ? 's' : ''} before trying again.`,
        };
      }
    }

    // Success pairing
    session.mobileSocketId = mobileSocketId;
    session.state = 'connected';
    this.socketToSession.set(mobileSocketId, code);

    // Explicitly mark code as permanently consumed
    this.usedCodes.add(code);

    return {
      success: true,
      session,
    };
  }

  /**
   * Registers a failed code attempt on a session to trigger progressive cooldown.
   */
  recordFailedAttempt(code) {
    const session = this.sessions.get(code);
    if (session) {
      session.failedAttempts++;
      session.lastAttemptAt = Date.now();
    }
  }

  /**
   * Gets session by 6-digit code.
   */
  getSessionByCode(code) {
    return this.sessions.get(code) || null;
  }

  /**
   * Gets session associated with a socket ID.
   */
  getSessionBySocketId(socketId) {
    const code = this.socketToSession.get(socketId);
    if (!code) return null;
    return this.sessions.get(code) || null;
  }

  /**
   * Destroys a session and cleans up socket mappings.
   * Ensures code is marked permanently used.
   */
  destroySession(code) {
    const session = this.sessions.get(code);
    if (session) {
      this.usedCodes.add(code);
      if (session.desktopSocketId) this.socketToSession.delete(session.desktopSocketId);
      if (session.mobileSocketId) this.socketToSession.delete(session.mobileSocketId);
      this.sessions.delete(code);
      return session;
    }
    return null;
  }

  /**
   * Cleans up session associated with a socket when it disconnects.
   */
  removeSocketSession(socketId) {
    const code = this.socketToSession.get(socketId);
    if (code) {
      return this.destroySession(code);
    }
    return null;
  }

  /**
   * Periodic cleanup of stale inactive sessions (older than 10 mins).
   */
  cleanupStaleSessions(maxAgeMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [code, session] of this.sessions.entries()) {
      if (now - session.createdAt > maxAgeMs) {
        this.destroySession(code);
      }
    }
  }
}

export const sessionManager = new SessionManager();
