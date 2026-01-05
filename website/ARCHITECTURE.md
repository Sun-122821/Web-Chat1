# End-to-End Encrypted Messaging System Architecture

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React UI   │  │  Encryption  │  │  WebSocket   │       │
│  │   Component  │→ │   Module     │→ │   Client     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Local Storage │                        │
│                    │  (Keys Only)   │                        │
│                    └────────────────┘                        │
└────────────────────────────┬─────────────────────────────────┘
                              │
                              │ Encrypted Messages Only
                              │ (No Plaintext, No Keys)
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                      SERVER (Node.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Express    │  │  Socket.io   │  │   MongoDB    │       │
│  │   REST API   │  │   Server     │  │   Database   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Encrypted Data │                        │
│                    │  Only (Blobs)   │                        │
│                    └────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

## Encryption Flow

### 1. User Registration/Login
```
User → Generate Key Pair (ECDH) → Store Private Key Locally
     → Send Public Key to Server → Server Stores Public Key Only
```

### 2. One-to-One Message Flow
```
Sender:
1. Generate AES-256-GCM key (ephemeral)
2. Encrypt message with AES key
3. Encrypt AES key with recipient's public key (RSA-OAEP)
4. Send: {encryptedMessage, encryptedKey, iv, authTag}

Recipient:
1. Receive encrypted data
2. Decrypt AES key with private key
3. Decrypt message with AES key
4. Display plaintext
```

### 3. Group Chat Flow
```
Group Creation:
1. Admin generates shared AES-256-GCM key
2. Encrypt shared key with each member's public key
3. Store encrypted keys in database

Message Sending:
1. Encrypt message with group's shared AES key
2. Send encrypted message to server
3. Server broadcasts to all group members

Message Receiving:
1. Receive encrypted message
2. Decrypt group's shared key with private key
3. Decrypt message with shared key
```

## Tech Stack Choices

### Frontend: React + Vite
- **Why**: Beginner-friendly, great documentation, fast development
- **Free**: Yes, open source
- **Learning curve**: Moderate, but well-supported

### Backend: Node.js + Express
- **Why**: Same language as frontend, beginner-friendly
- **Free**: Yes, open source
- **Learning curve**: Low if you know JavaScript

### Realtime: Socket.io
- **Why**: Works seamlessly with Express, handles reconnection automatically
- **Free**: Yes, open source
- **Learning curve**: Low

### Database: MongoDB Atlas
- **Why**: Free tier (512MB), easy to use, good for JSON data
- **Free**: Yes, 512MB free tier
- **Learning curve**: Low

### Hosting: 
- **Frontend**: Vercel (free tier, automatic deployments)
- **Backend**: Railway or Render (free tier available)
- **Why**: Both have free tiers, easy deployment

### Encryption: Web Crypto API
- **Why**: Built into browsers, audited, no external dependencies
- **Free**: Yes, native browser API
- **Learning curve**: Moderate (we'll abstract it)

## Security Guarantees

✅ **Server cannot read messages**: All encryption happens client-side
✅ **Database leaks are safe**: Only encrypted blobs stored
✅ **Network interception safe**: Messages encrypted before transmission
✅ **Admin access safe**: Admins see only encrypted data
✅ **Key storage safe**: Keys never leave client device

## Limitations

⚠️ **Key Recovery**: If user loses device, keys are lost (by design for security)
⚠️ **No Metadata Protection**: Server knows who talks to whom (but not what)
⚠️ **No Forward Secrecy**: Compromised key can decrypt old messages
⚠️ **Browser Storage**: Keys stored in localStorage (vulnerable to XSS)
⚠️ **No Mobile Apps**: Web-only (as requested)

## Future Improvements

- Implement forward secrecy (Double Ratchet)
- Add metadata protection (mixnets)
- Implement key backup (encrypted with user password)
- Add file encryption for attachments
- Implement perfect forward secrecy for groups
- Add message expiration/self-destruct
