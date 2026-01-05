import { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage } from '../utils/crypto-utils';
import { getUserData } from '../utils/storage';
import './ChatWindow.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ChatWindow({ chat, user, socket, connected }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch recipient's public key
  useEffect(() => {
    if (!chat.userId) return;

    fetch(`${API_URL}/api/users/${chat.userId}`)
      .then(res => res.json())
      .then(data => {
        setRecipientPublicKey(data.publicKey);
        // Load message history
        if (socket) {
          socket.emit('get-history', { recipientId: chat.userId });
        }
      })
      .catch(err => console.error('Error fetching user:', err));
  }, [chat.userId, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = async (data) => {
      if (data.senderId !== chat.userId) return;

      try {
        const decrypted = await decryptMessage(
          {
            encryptedMessage: data.encryptedMessage,
            encryptedKey: data.encryptedKey,
            iv: data.iv,
            authTag: data.authTag
          },
          user.privateKey
        );

        setMessages(prev => [...prev, {
          id: data.messageId,
          text: decrypted,
          senderId: data.senderId,
          timestamp: new Date(data.timestamp),
          isOwn: false
        }]);

        // Mark as read
        socket.emit('mark-read', { messageId: data.messageId });
      } catch (error) {
        console.error('Decryption error:', error);
      }
    };

    const handleMessageSent = (data) => {
      setSending(false);
    };

    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, read: true } : msg
      ));
    };

    const handleUserTyping = (data) => {
      if (data.userId === chat.userId) {
        setTypingUsers(prev => {
          if (data.isTyping && !prev.includes(data.userId)) {
            return [...prev, data.userId];
          } else if (!data.isTyping) {
            return prev.filter(id => id !== data.userId);
          }
          return prev;
        });
      }
    };

    const handleHistory = async (data) => {
      const decryptedMessages = await Promise.all(
        data.messages.map(async (msg) => {
          try {
            const isOwn = msg.senderId === user.userId;
            let decrypted = '';
            
            if (isOwn) {
              // For own messages, we need to decrypt with recipient's key
              // In a real implementation, you'd store the decrypted version
              decrypted = '[Encrypted message]';
            } else {
              decrypted = await decryptMessage(
                {
                  encryptedMessage: msg.encryptedMessage,
                  encryptedKey: msg.encryptedKey,
                  iv: msg.iv,
                  authTag: msg.authTag
                },
                user.privateKey
              );
            }

            return {
              id: msg._id,
              text: decrypted,
              senderId: msg.senderId,
              timestamp: new Date(msg.timestamp),
              isOwn,
              read: !!msg.readAt
            };
          } catch (error) {
            console.error('Error decrypting message:', error);
            return null;
          }
        })
      );

      setMessages(decryptedMessages.filter(m => m !== null));
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('message-read', handleMessageRead);
    socket.on('user-typing', handleUserTyping);
    socket.on('history', handleHistory);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('message-read', handleMessageRead);
      socket.off('user-typing', handleUserTyping);
      socket.off('history', handleHistory);
    };
  }, [socket, chat.userId, user.privateKey, user.userId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !recipientPublicKey || sending || !connected) return;

    setSending(true);
    const messageText = inputMessage.trim();
    setInputMessage('');

    try {
      // Encrypt message
      const encrypted = await encryptMessage(messageText, recipientPublicKey);

      // Send via socket
      socket.emit('send-message', {
        recipientId: chat.userId,
        ...encrypted,
        messageType: 'text'
      });

      // Add to local messages (optimistic update)
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        text: messageText,
        senderId: user.userId,
        timestamp: new Date(),
        isOwn: true,
        read: false
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setInputMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !connected) return;

    setIsTyping(true);
    socket.emit('typing', { recipientId: chat.userId, isTyping: true });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { recipientId: chat.userId, isTyping: false });
    }, 3000);
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <h3>{chat.nickname}</h3>
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
                <p>{msg.text}</p>
                <div className="message-meta">
                  <span className="timestamp">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.isOwn && (
                    <span className="read-status">
                      {msg.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {chat.nickname} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          placeholder={connected ? "Type a message..." : "Connecting..."}
          disabled={!connected || sending || !recipientPublicKey}
          maxLength={5000}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending || !connected || !recipientPublicKey}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
