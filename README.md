# ⚡ Quicksand — Instant Phone ↔ Computer Transfer

Quicksand is a zero-login, high-speed web application that enables instant text, file, photo, video, document, and binary data transfer between a phone and any computer without logging into WhatsApp, creating an account, installing an app, or losing media quality.

![Quicksand UI](https://raw.githubusercontent.com/shashankpawar0113/quicksand/main/client/public/preview.png)

---

## 🌟 Key Features

- **Zero Friction Setup**: Open site → Get 6-digit code → Enter on phone → Connected in seconds. No email, username, or app install required.
- **Cryptographic One-Time Pairing**: Every browser session gets a cryptographically random 6-digit code. Pairing permanently consumes and destroys the code (`usedCodes` set prevents code reuse).
- **Shared-IP Friendly Security**: Progressive session-code cooldown rate limiting protects against brute force while remaining campus/public Wi-Fi friendly.
- **WebRTC P2P + In-Memory Relay Fallback**:
  - **Primary**: Direct P2P WebRTC DataChannel connection.
  - **Fallback**: Automatic switch to Socket.IO memory streaming if WebRTC is blocked by restrictive firewalls. Zero disk storage used.
- **Zero Quality Loss**: Files (photos, 4K videos, zip files, documents) are transferred exact byte-for-byte without client-side compression or re-encoding.
- **Non-Blocking SHA-256 Data Integrity**: Real-time Web Crypto API hash computation displays `Verifying...` → `✓ SHA-256 Verified` without delaying file access.
- **Instant Text & Clipboard Sharing**: Bidirectional text/link sharing with one-tap copy button.
- **Multi-File Queue & Speed Tracking**: Drag-and-drop file upload, real-time speed metrics (MB/s), and estimated time remaining (ETA).

---

## 🛠️ Architecture

```
                  Quicksand Server (Node.js + Socket.IO)
                                  │
                       Signaling & Pairing Only
                                  │
             ┌────────────────────┴────────────────────┐
             │                                         │
       Computer Browser                          Phone Browser
             │                                         │
             └────────────── WebRTC P2P ───────────────┘
                                  │
                      (Fallback: Socket.IO Relay)
```

---

## 🚀 Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/shashankpawar0113/quicksand.git
cd quicksand

# Install dependencies
npm install

# Start development server (Runs client & server concurrently)
npm run dev
```

### Production Build & Server

```bash
# Build Vite client bundle
npm run build

# Start production Node.js server (serves build on port 3001)
npm start
```

---

## 🛡️ Privacy & Security

- **No Permanent File Storage**: All data transfers happen in-memory directly between browsers or through transient in-memory socket buffers.
- **Session Expiration**: Inactive session codes auto-expire after 10 minutes.
- **Code Destruction**: Once two devices pair, the 6-digit code is immediately destroyed.

---

## 📄 License

MIT License. Built with React, Vite, Socket.IO, and WebRTC.
