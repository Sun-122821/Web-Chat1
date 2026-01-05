/**
 * Local Storage Utilities
 * 
 * Stores encryption keys and user data locally
 * 
 * SECURITY WARNING:
 * - localStorage is vulnerable to XSS attacks
 * - For production, consider encrypting keys with user password
 * - Never store sensitive data in localStorage in production
 */

const STORAGE_KEYS = {
  USER_ID: 'e2ee_userId',
  NICKNAME: 'e2ee_nickname',
  RSA_PUBLIC_KEY: 'e2ee_rsaPublicKey',
  RSA_PRIVATE_KEY: 'e2ee_rsaPrivateKey',
  GROUP_KEYS: 'e2ee_groupKeys' // Map of groupId -> shared key
};

export function saveUserData(userId, nickname, publicKey, privateKey) {
  localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  localStorage.setItem(STORAGE_KEYS.NICKNAME, nickname);
  localStorage.setItem(STORAGE_KEYS.RSA_PUBLIC_KEY, publicKey);
  localStorage.setItem(STORAGE_KEYS.RSA_PRIVATE_KEY, privateKey);
}

export function getUserData() {
  return {
    userId: localStorage.getItem(STORAGE_KEYS.USER_ID),
    nickname: localStorage.getItem(STORAGE_KEYS.NICKNAME),
    publicKey: localStorage.getItem(STORAGE_KEYS.RSA_PUBLIC_KEY),
    privateKey: localStorage.getItem(STORAGE_KEYS.RSA_PRIVATE_KEY)
  };
}

export function clearUserData() {
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.removeItem(STORAGE_KEYS.NICKNAME);
  localStorage.removeItem(STORAGE_KEYS.RSA_PUBLIC_KEY);
  localStorage.removeItem(STORAGE_KEYS.RSA_PRIVATE_KEY);
  localStorage.removeItem(STORAGE_KEYS.GROUP_KEYS);
}

export function saveGroupKey(groupId, groupKey) {
  const groupKeys = getGroupKeys();
  groupKeys[groupId] = groupKey;
  localStorage.setItem(STORAGE_KEYS.GROUP_KEYS, JSON.stringify(groupKeys));
}

export function getGroupKey(groupId) {
  const groupKeys = getGroupKeys();
  return groupKeys[groupId];
}

function getGroupKeys() {
  const stored = localStorage.getItem(STORAGE_KEYS.GROUP_KEYS);
  return stored ? JSON.parse(stored) : {};
}
