/**
 * Encryption Utilities
 * 
 * Uses Web Crypto API (built into browsers)
 * All encryption/decryption happens client-side
 * 
 * SECURITY NOTES:
 * - Keys are stored in localStorage (vulnerable to XSS)
 * - For production, consider encrypting keys with user password
 * - Never send private keys to server
 */

/**
 * Generate a key pair for the user (ECDH P-256)
 * Returns: { publicKey, privateKey } as CryptoKey objects
 */
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  return keyPair;
}

/**
 * Export private key to string for storage
 */
export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import private key from string
 */
export async function importPrivateKey(keyString) {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Export public key to string for sharing
 */
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from string
 */
export async function importPublicKey(keyString) {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey']
  );
}

/**
 * Generate RSA key pair for encrypting AES keys
 * Used for one-to-one message encryption
 */
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export RSA public key
 */
export async function exportRSAPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import RSA public key
 */
export async function importRSAPublicKey(keyString) {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}

/**
 * Export RSA private key
 */
export async function exportRSAPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import RSA private key
 */
export async function importRSAPrivateKey(keyString) {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['decrypt']
  );
}

/**
 * Generate AES-256-GCM key for message encryption
 */
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export AES key to string
 */
export async function exportAESKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import AES key from string
 */
export async function importAESKey(keyString) {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt message for one-to-one chat
 * Uses AES-256-GCM for message, RSA-OAEP for key exchange
 */
export async function encryptMessage(message, recipientPublicKeyString) {
  try {
    // Convert message to ArrayBuffer
    const messageBuffer = new TextEncoder().encode(message);

    // Generate ephemeral AES key
    const aesKey = await generateAESKey();

    // Generate random IV (96 bits for AES-GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt message with AES-GCM
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      messageBuffer
    );

    // Extract auth tag (last 16 bytes)
    const authTag = encryptedData.slice(-16);
    const ciphertext = encryptedData.slice(0, -16);

    // Export AES key
    const exportedAESKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // Import recipient's public key
    const recipientPublicKey = await importRSAPublicKey(recipientPublicKeyString);

    // Encrypt AES key with recipient's public key
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      recipientPublicKey,
      exportedAESKey
    );

    return {
      encryptedMessage: arrayBufferToBase64(ciphertext),
      encryptedKey: arrayBufferToBase64(encryptedKey),
      iv: arrayBufferToBase64(iv),
      authTag: arrayBufferToBase64(authTag)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt one-to-one message
 */
export async function decryptMessage(encryptedData, privateKeyString) {
  try {
    const { encryptedMessage, encryptedKey, iv, authTag } = encryptedData;

    // Import private key
    const privateKey = await importRSAPrivateKey(privateKeyString);

    // Decrypt AES key
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
    const decryptedAESKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedKeyBuffer
    );

    // Import AES key
    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      decryptedAESKeyBuffer,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['decrypt']
    );

    // Combine ciphertext and auth tag
    const ciphertext = base64ToArrayBuffer(encryptedMessage);
    const tag = base64ToArrayBuffer(authTag);
    const ivBuffer = base64ToArrayBuffer(iv);

    const encryptedBuffer = new Uint8Array(ciphertext.length + tag.length);
    encryptedBuffer.set(new Uint8Array(ciphertext), 0);
    encryptedBuffer.set(new Uint8Array(tag), ciphertext.length);

    // Decrypt message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      aesKey,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt message for group chat
 * Uses shared AES key
 */
export async function encryptGroupMessage(message, groupKeyString) {
  try {
    const messageBuffer = new TextEncoder().encode(message);
    const groupKey = await importAESKey(groupKeyString);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt message
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      groupKey,
      messageBuffer
    );

    // Extract auth tag
    const authTag = encryptedData.slice(-16);
    const ciphertext = encryptedData.slice(0, -16);

    return {
      encryptedMessage: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      authTag: arrayBufferToBase64(authTag)
    };
  } catch (error) {
    console.error('Group encryption error:', error);
    throw new Error('Failed to encrypt group message');
  }
}

/**
 * Decrypt group message
 */
export async function decryptGroupMessage(encryptedData, groupKeyString) {
  try {
    const { encryptedMessage, iv, authTag } = encryptedData;
    const groupKey = await importAESKey(groupKeyString);

    // Combine ciphertext and auth tag
    const ciphertext = base64ToArrayBuffer(encryptedMessage);
    const tag = base64ToArrayBuffer(authTag);
    const ivBuffer = base64ToArrayBuffer(iv);

    const encryptedBuffer = new Uint8Array(ciphertext.length + tag.length);
    encryptedBuffer.set(new Uint8Array(ciphertext), 0);
    encryptedBuffer.set(new Uint8Array(tag), ciphertext.length);

    // Decrypt message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      groupKey,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Group decryption error:', error);
    throw new Error('Failed to decrypt group message');
  }
}

/**
 * Encrypt file/blob for sending
 */
export async function encryptFile(file, recipientPublicKeyString) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Generate ephemeral AES key
  const aesKey = await generateAESKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt file
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    aesKey,
    arrayBuffer
  );

  const authTag = encryptedData.slice(-16);
  const ciphertext = encryptedData.slice(0, -16);

  // Encrypt AES key
  const exportedAESKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const recipientPublicKey = await importRSAPublicKey(recipientPublicKeyString);
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    exportedAESKey
  );

  return {
    encryptedFile: arrayBufferToBase64(ciphertext),
    encryptedKey: arrayBufferToBase64(encryptedKey),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  };
}

/**
 * Decrypt file/blob
 */
export async function decryptFile(encryptedFileData, privateKeyString) {
  const { encryptedFile, encryptedKey, iv, authTag, fileName, fileType } = encryptedFileData;

  // Decrypt AES key
  const privateKey = await importRSAPrivateKey(privateKeyString);
  const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
  const decryptedAESKeyBuffer = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedKeyBuffer
  );

  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    decryptedAESKeyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  // Decrypt file
  const ciphertext = base64ToArrayBuffer(encryptedFile);
  const tag = base64ToArrayBuffer(authTag);
  const ivBuffer = base64ToArrayBuffer(iv);

  const encryptedBuffer = new Uint8Array(ciphertext.length + tag.length);
  encryptedBuffer.set(new Uint8Array(ciphertext), 0);
  encryptedBuffer.set(new Uint8Array(tag), ciphertext.length);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    aesKey,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: fileType });
}

// ==================== Helper Functions ====================

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
