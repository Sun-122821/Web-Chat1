# Encryption Design Document

## Key Generation

### User Identity Keys (ECDH P-256)
- **Purpose**: Key exchange and identity verification
- **Algorithm**: ECDH with P-256 curve
- **Storage**: Private key in browser localStorage (encrypted with user password if login)
- **Public Key**: Stored on server, shared with other users

### Message Encryption Keys (AES-256-GCM)
- **Purpose**: Encrypt actual message content
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Properties**: 
  - Provides confidentiality (encryption)
  - Provides authenticity (authentication tag)
  - Includes nonce (IV) for uniqueness

### Key Exchange Flow

#### One-to-One Chat
```
1. Alice generates ephemeral AES key
2. Alice encrypts message with AES key
3. Alice fetches Bob's public key from server
4. Alice encrypts AES key with Bob's public key (RSA-OAEP)
5. Alice sends: {encryptedMessage, encryptedKey, iv, authTag}
6. Bob receives and decrypts AES key with private key
7. Bob decrypts message with AES key
```

#### Group Chat
```
1. Group creator generates shared AES key
2. Creator encrypts shared key with each member's public key
3. Encrypted keys stored in database
4. Each member decrypts shared key with their private key
5. All messages encrypted with shared key
```

## Code Structure

### Encryption Module (`crypto-utils.js`)
```javascript
// Key generation
- generateKeyPair() → {publicKey, privateKey}
- exportPrivateKey(privateKey) → string
- importPrivateKey(keyString) → CryptoKey

// Encryption
- encryptMessage(message, recipientPublicKey) → encryptedData
- decryptMessage(encryptedData, privateKey) → message

// Group encryption
- encryptGroupMessage(message, groupKey) → encryptedData
- decryptGroupMessage(encryptedData, groupKey) → message
```

## Security Considerations

### ✅ What We Protect
- Message content (confidentiality)
- Message integrity (authentication)
- Replay attacks (nonce/IV)

### ⚠️ What We Don't Protect (Limitations)
- Metadata (who talks to whom, when)
- Forward secrecy (compromised key = all messages readable)
- Key recovery (lost device = lost keys)

### 🔒 Best Practices Implemented
- Use authenticated encryption (AES-GCM)
- Use cryptographically secure random IVs
- Never reuse keys
- Keys never sent to server
- Encrypt before network transmission
