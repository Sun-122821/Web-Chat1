import { useState, useEffect, useRef } from 'react';
import { encryptGroupMessage, decryptGroupMessage, importRSAPrivateKey } from '../utils/crypto-utils';
import { saveGroupKey, getGroupKey } from '../utils/storage';
import './ChatWindow.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function GroupChatWindow({ group, user, socket, connected }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [groupKey, setGroupKey] = useState(null);
  const [members, setMembers] = useState([]);
  const messagesEndRef = useRef(null);

  // Load group data and decrypt shared key
  useEffect(() => {
    if (!group.groupId) return;

    fetch(`${API_URL}/api/groups/${group.groupId}?userId=${user.userId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch group');
        }
        return res.json();
      })
      .then(async (data) => {
        setMembers(data.members);

        // Find encrypted key for current user
        const userEncryptedKey = data.encryptedKeys.find(
          ek => ek.userId === user.userId
        );

        if (userEncryptedKey) {
          // Check if we already have the group key cached
          const cachedKey = getGroupKey(group.groupId);
          if (cachedKey) {
            setGroupKey(cachedKey);
            if (socket) {
              socket.emit('get-history', { groupId: group.groupId });
            }
            return;
          }

          // Decrypt group key with user's private key
          try {
            const privateKey = await importRSAPrivateKey(user.privateKey);
            
            // Decrypt the group key
            const encryptedKeyBuffer = base64ToArrayBuffer(userEncryptedKey.encryptedKey);
            const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
              { name: 'RSA-OAEP' },
              privateKey,
              encryptedKeyBuffer
            );

            // Convert to base64 string for storage
            const groupKeyString = arrayBufferToBase64(decryptedKeyBuffer);
            setGroupKey(groupKeyString);
            saveGroupKey(group.groupId, groupKeyString);

            // Load message history
            if (socket) {
              socket.emit('get-history', { groupId: group.groupId });
            }
          } catch (error) {
            console.error('Error decrypting group key:', error);
            alert('Failed to decrypt group key. You may not be a member.');
          }
        } else {
          alert('You are not a member of this group');
        }
      })
      .catch(err => console.error('Error fetching group:', err));
  }, [group.groupId, socket, user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !groupKey) return;

    const handleReceiveGroupMessage = async (data) => {
      if (data.groupId !== group.groupId) return;

      try {
        const decrypted = await decryptGroupMessage(
          {
            encryptedMessage: data.encryptedMessage,
            iv: data.iv,
            authTag: data.authTag
          },
          groupKey
        );

        setMessages(prev => [...prev, {
          id: data.messageId,
          text: decrypted,
          senderId: data.senderId,
          timestamp: new Date(data.timestamp),
          isOwn: data.senderId === user.userId
        }]);
      } catch (error) {
        console.error('Group decryption error:', error);
      }
    };

    const handleGroupMessageSent = (data) => {
      setSending(false);
    };

    const handleHistory = async (data) => {
      const decryptedMessages = await Promise.all(
        data.messages.map(async (msg) => {
          try {
            const decrypted = await decryptGroupMessage(
              {
                encryptedMessage: msg.encryptedMessage,
                iv: msg.iv,
                authTag: msg.authTag
              },
              groupKey
            );

            return {
              id: msg._id,
              text: decrypted,
              senderId: msg.senderId,
              timestamp: new Date(msg.timestamp),
              isOwn: msg.senderId === user.userId
            };
          } catch (error) {
            console.error('Error decrypting group message:', error);
            return null;
          }
        })
      );

      setMessages(decryptedMessages.filter(m => m !== null));
    };

    socket.on('receive-group-message', handleReceiveGroupMessage);
    socket.on('group-message-sent', handleGroupMessageSent);
    socket.on('history', handleHistory);

    return () => {
      socket.off('receive-group-message', handleReceiveGroupMessage);
      socket.off('group-message-sent', handleGroupMessageSent);
      socket.off('history', handleHistory);
    };
  }, [socket, group.groupId, groupKey, user.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !groupKey || sending || !connected) return;

    setSending(true);
    const messageText = inputMessage.trim();
    setInputMessage('');

    try {
      const encrypted = await encryptGroupMessage(messageText, groupKey);

      socket.emit('send-group-message', {
        groupId: group.groupId,
        ...encrypted,
        messageType: 'text'
      });

      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        text: messageText,
        senderId: user.userId,
        timestamp: new Date(),
        isOwn: true
      }]);
    } catch (error) {
      console.error('Error sending group message:', error);
      alert('Failed to send message. Please try again.');
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const getSenderName = (senderId) => {
    const member = members.find(m => m.userId === senderId);
    return member ? member.nickname : 'Unknown';
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div>
          <h3>👥 {group.name}</h3>
          <small>{members.length} members</small>
        </div>
        {!connected && <span className="offline-badge">Offline</span>}
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`message ${msg.isOwn ? 'own' : 'other'}`}
            >
              <div className="message-content">
                {!msg.isOwn && (
                  <div className="sender-name">{getSenderName(msg.senderId)}</div>
                )}
                <p>{msg.text}</p>
                <div className="message-meta">
                  <span className="timestamp">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={connected ? "Type a message..." : "Connecting..."}
          disabled={!connected || sending || !groupKey}
          maxLength={5000}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending || !connected || !groupKey}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

// Helper functions
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
