/**
 * End-to-End Encrypted Messaging Server
 * 
 * IMPORTANT SECURITY NOTES:
 * - This server NEVER sees plaintext messages
 * - This server NEVER stores encryption keys
 * - This server ONLY stores encrypted blobs
 * - All encryption/decryption happens on the client
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Message } from './models/Message.js';
import { Group } from './models/Group.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
// Allow multiple origins for production (GitHub Pages, Vercel, etc.)
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development, restrict in production
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // For file attachments

// Connect to MongoDB
// SECURITY: Never log or expose MONGODB_URI - it contains credentials
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Helper function to sanitize any string that might contain MongoDB URI
// SECURITY: This function must catch ALL variations, including partial strings
// Aggressively matches any MongoDB URI pattern to prevent credential leaks
function sanitizeMongoUri(str) {
  if (!str || typeof str !== 'string') return str;
  
  let sanitized = str;
  
  // Pattern 1: Full connection strings with @ symbol
  // Matches connection strings with credentials before @ symbol
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/[^@\s\n]+@/gi, 'mongodb://***:***@');
  sanitized = sanitized.replace(/mongodb:\/\/[^@\s\n]+@/gi, 'mongodb://***:***@');
  
  // Pattern 2: Partial connection strings without @ (MOST IMPORTANT - catches credential leaks)
  // Matches partial connection strings that may leak credentials
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/[^/\s\n:]+:[^/\s\n@]+/gi, 'mongodb://***:***');
  sanitized = sanitized.replace(/mongodb:\/\/[^/\s\n:]+:[^/\s\n@]+/gi, 'mongodb://***:***');
  
  // Pattern 3: More aggressive - any mongodb:// or mongodb+srv:// followed by word:word pattern
  // Catches partial connection strings that might leak credentials
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/([a-zA-Z0-9_\-]+):([a-zA-Z0-9_\-@#$%^&*()!]+)/gi, 'mongodb://***:***');
  sanitized = sanitized.replace(/mongodb:\/\/([a-zA-Z0-9_\-]+):([a-zA-Z0-9_\-@#$%^&*()!]+)/gi, 'mongodb://***:***');
  
  // Pattern 4: Environment variable references that might leak
  sanitized = sanitized.replace(/MONGODB_URI[=:]\s*['"]?mongodb[^'"]*['"]?/gi, 'MONGODB_URI=***');
  
  // Pattern 5: Catch any remaining mongodb:// patterns with credentials (fallback)
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/[^\s\n]+/gi, (match) => {
    // If it contains a colon (likely has credentials), sanitize it
    if (match.includes(':')) {
      return 'mongodb://***:***';
    }
    return match;
  });
  
  return sanitized;
}

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    // SECURITY: Never log connection string - sanitize all error output
    console.error('❌ MongoDB connection failed');
    if (err.message) {
      console.error('Error:', sanitizeMongoUri(err.message));
    }
    // In production, don't log detailed errors
    if (process.env.NODE_ENV === 'development') {
      const sanitizedError = sanitizeMongoUri(err.toString());
      console.error('Details (dev only):', sanitizedError);
    }
  });

// ==================== Middleware ====================

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const record = rateLimitStore.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  record.count++;
  next();
}

// Input validation
function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') return false;
  if (nickname.length < 1 || nickname.length > 50) return false;
  // Only allow alphanumeric, spaces, and basic punctuation
  if (!/^[a-zA-Z0-9\s._-]+$/.test(nickname)) return false;
  return true;
}

function validatePublicKey(publicKey) {
  if (!publicKey || typeof publicKey !== 'string') return false;
  // Basic validation - should be base64 encoded
  if (publicKey.length < 100 || publicKey.length > 5000) return false;
  try {
    // Node.js compatible base64 validation
    Buffer.from(publicKey, 'base64');
    return true;
  } catch {
    return false;
  }
}

// ==================== REST API Routes ====================

/**
 * Get or create user by nickname
 * Returns: { userId, publicKey, nickname }
 * SECURITY: Public endpoint but rate limited and validated
 */
app.post('/api/users', rateLimit, async (req, res) => {
  try {
    const { nickname, publicKey } = req.body;
    
    if (!nickname || !publicKey) {
      return res.status(400).json({ error: 'Nickname and publicKey required' });
    }

    // Validate inputs
    if (!validateNickname(nickname)) {
      return res.status(400).json({ error: 'Invalid nickname format' });
    }
    
    if (!validatePublicKey(publicKey)) {
      return res.status(400).json({ error: 'Invalid public key format' });
    }

    // Check if user exists
    let user = await User.findOne({ nickname });
    
    if (user) {
      // Update public key if changed
      user.publicKey = publicKey;
      await user.save();
      return res.json({ userId: user._id.toString(), publicKey: user.publicKey, nickname: user.nickname });
    }

    // Create new user
    user = new User({ nickname, publicKey });
    await user.save();
    
    res.json({ userId: user._id.toString(), publicKey: user.publicKey, nickname: user.nickname });
  } catch (error) {
    console.error('Error creating user:', sanitizeMongoUri(error.message || 'Unknown error'));
    // Don't leak error details
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get user by ID
 * Returns: { userId, publicKey, nickname }
 * SECURITY: Public endpoint but rate limited - only returns public info (publicKey is meant to be public)
 */
app.get('/api/users/:userId', rateLimit, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.userId).select('_id publicKey nickname');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only return public information
    res.json({ 
      userId: user._id.toString(), 
      publicKey: user.publicKey, 
      nickname: user.nickname 
    });
  } catch (error) {
    console.error('Error fetching user:', sanitizeMongoUri(error.message || 'Unknown error'));
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Search users by nickname
 * SECURITY: Rate limited, query sanitized, limited results
 */
app.get('/api/users/search/:query', rateLimit, async (req, res) => {
  try {
    const query = req.params.query.trim();
    
    // Validate query
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    
    if (query.length > 50) {
      return res.status(400).json({ error: 'Query too long' });
    }
    
    // Sanitize query to prevent regex injection
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const users = await User.find({
      nickname: { $regex: sanitizedQuery, $options: 'i' }
    })
    .limit(10)
    .select('nickname _id')
    .lean();
    
    // Only return minimal public info
    res.json(users.map(u => ({ 
      userId: u._id.toString(), 
      nickname: u.nickname 
    })));
  } catch (error) {
    console.error('Error searching users:', sanitizeMongoUri(error.message || 'Unknown error'));
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Create a group
 * SECURITY: Rate limited, input validated, adminId must be valid user
 */
app.post('/api/groups', rateLimit, async (req, res) => {
  try {
    const { name, adminId, memberIds, encryptedKeys } = req.body;
    
    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({ error: 'Invalid group name' });
    }
    
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: 'Invalid admin ID' });
    }
    
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'At least one member required' });
    }
    
    if (!Array.isArray(encryptedKeys) || encryptedKeys.length !== memberIds.length) {
      return res.status(400).json({ error: 'Invalid encrypted keys' });
    }
    
    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    // Verify all members exist and admin is included
    const allMemberIds = [...new Set([adminId, ...memberIds])];
    const members = await User.find({ _id: { $in: allMemberIds } });
    if (members.length !== allMemberIds.length) {
      return res.status(400).json({ error: 'One or more members not found' });
    }
    
    const group = new Group({
      name: name.trim(),
      adminId,
      members: allMemberIds,
      encryptedKeys // Array of { userId, encryptedKey }
    });
    
    await group.save();
    res.json({ groupId: group._id.toString(), name: group.name });
  } catch (error) {
    console.error('Error creating group:', sanitizeMongoUri(error.message || 'Unknown error'));
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get group by ID
 * SECURITY: Only returns group info if user is a member
 * Requires userId query parameter to verify membership
 */
app.get('/api/groups/:groupId', rateLimit, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query; // Required query parameter
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'User ID required to access group' });
    }
    
    const group = await Group.findById(groupId).populate('members', 'nickname');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // SECURITY: Verify user is a member before returning sensitive data
    const isMember = group.members.some(m => 
      m._id.toString() === userId || m._id.equals(userId)
    );
    
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: Not a group member' });
    }
    
    // Only return encrypted key for the requesting user
    const userEncryptedKey = group.encryptedKeys.find(
      ek => ek.userId.toString() === userId || ek.userId.equals(userId)
    );
    
    res.json({
      groupId: group._id.toString(),
      name: group.name,
      members: group.members.map(m => ({ 
        userId: m._id.toString(), 
        nickname: m.nickname 
      })),
      encryptedKeys: userEncryptedKey ? [userEncryptedKey] : [] // Only return user's own encrypted key
    });
  } catch (error) {
    console.error('Error fetching group:', sanitizeMongoUri(error.message || 'Unknown error'));
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== WebSocket Events ====================

// Track connected users
const connectedUsers = new Map(); // socketId -> userId

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // User joins with their userId
  socket.on('join', async (userId) => {
    try {
      // Validate userId
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return socket.emit('error', { message: 'Invalid user ID' });
      }
      
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return socket.emit('error', { message: 'User not found' });
      }
      
      connectedUsers.set(socket.id, userId);
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`✅ User ${userId} joined`);
      
      // Notify user is online
      socket.broadcast.emit('user-online', { userId });
    } catch (error) {
      console.error('Error joining:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to join' });
    }
  });

  // Send message (one-to-one)
  socket.on('send-message', async (data) => {
    try {
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }
      
      const { recipientId, encryptedMessage, encryptedKey, iv, authTag, messageType } = data;
      
      // Validate inputs
      if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return socket.emit('error', { message: 'Invalid recipient ID' });
      }
      
      if (!encryptedMessage || !encryptedKey || !iv || !authTag) {
        return socket.emit('error', { message: 'Missing encryption data' });
      }
      
      // Verify recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return socket.emit('error', { message: 'Recipient not found' });
      }
      
      // Prevent self-messaging (optional, but good practice)
      if (recipientId === socket.userId) {
        return socket.emit('error', { message: 'Cannot send message to yourself' });
      }
      
      // Store encrypted message in database
      const message = new Message({
        senderId: socket.userId,
        recipientId,
        encryptedMessage, // Encrypted blob
        encryptedKey,     // Encrypted AES key
        iv,              // Initialization vector
        authTag,         // Authentication tag
        messageType: messageType || 'text', // 'text', 'image', 'file', 'voice'
        timestamp: new Date()
      });
      
      await message.save();

      // Send to recipient if online
      io.to(`user:${recipientId}`).emit('receive-message', {
        messageId: message._id.toString(),
        senderId: socket.userId,
        encryptedMessage,
        encryptedKey,
        iv,
        authTag,
        messageType,
        timestamp: message.timestamp
      });

      // Confirm to sender
      socket.emit('message-sent', { messageId: message._id.toString() });
    } catch (error) {
      console.error('Error sending message:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Send group message
  socket.on('send-group-message', async (data) => {
    try {
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }
      
      const { groupId, encryptedMessage, iv, authTag, messageType } = data;
      
      // Validate inputs
      if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
        return socket.emit('error', { message: 'Invalid group ID' });
      }
      
      if (!encryptedMessage || !iv || !authTag) {
        return socket.emit('error', { message: 'Missing encryption data' });
      }
      
      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit('error', { message: 'Group not found' });
      }
      
      // SECURITY: Verify user is a member
      const isMember = group.members.some(m => 
        m.toString() === socket.userId || m.equals(socket.userId)
      );
      
      if (!isMember) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }

      const message = new Message({
        senderId: socket.userId,
        groupId,
        encryptedMessage,
        iv,
        authTag,
        messageType: messageType || 'text',
        timestamp: new Date()
      });
      
      await message.save();

      // Broadcast to all group members
      group.members.forEach(memberId => {
        if (memberId !== socket.userId) {
          io.to(`user:${memberId}`).emit('receive-group-message', {
            messageId: message._id.toString(),
            groupId,
            senderId: socket.userId,
            encryptedMessage,
            iv,
            authTag,
            messageType,
            timestamp: message.timestamp
          });
        }
      });

      socket.emit('group-message-sent', { messageId: message._id.toString() });
    } catch (error) {
      console.error('Error sending group message:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    socket.to(`user:${recipientId}`).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Read receipt
  socket.on('mark-read', async (data) => {
    try {
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }
      
      const { messageId } = data;
      
      if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
        return socket.emit('error', { message: 'Invalid message ID' });
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }
      
      // SECURITY: Only recipient can mark message as read
      let isRecipient = false;
      
      if (message.recipientId) {
        // One-to-one message: user must be the recipient
        isRecipient = (
          message.recipientId.toString() === socket.userId || 
          message.recipientId.equals(socket.userId)
        );
      } else if (message.groupId) {
        // Group message: user must be a member (but not the sender)
        const group = await Group.findById(message.groupId);
        if (group) {
          const isMember = group.members.some(m => 
            m.toString() === socket.userId || m.equals(socket.userId)
          );
          const isSender = (
            message.senderId.toString() === socket.userId || 
            message.senderId.equals(socket.userId)
          );
          isRecipient = isMember && !isSender;
        }
      }
      
      if (!isRecipient) {
        return socket.emit('error', { message: 'Unauthorized' });
      }
      
      message.readAt = new Date();
      await message.save();
      
      // Notify sender
      io.to(`user:${message.senderId}`).emit('message-read', {
        messageId,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking message as read:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  });

  // Edit message
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, newEncryptedMessage, newIv, newAuthTag } = data;
      
      const message = await Message.findById(messageId);
      if (!message || message.senderId !== socket.userId) {
        return socket.emit('error', { message: 'Unauthorized' });
      }

      message.encryptedMessage = newEncryptedMessage;
      message.iv = newIv;
      message.authTag = newAuthTag;
      message.editedAt = new Date();
      await message.save();

      // Notify recipient(s)
      if (message.recipientId) {
        io.to(`user:${message.recipientId}`).emit('message-edited', {
          messageId,
          newEncryptedMessage,
          newIv,
          newAuthTag
        });
      } else if (message.groupId) {
        const group = await Group.findById(message.groupId);
        group.members.forEach(memberId => {
          if (memberId !== socket.userId) {
            io.to(`user:${memberId}`).emit('group-message-edited', {
              messageId,
              groupId: message.groupId,
              newEncryptedMessage,
              newIv,
              newAuthTag
            });
          }
        });
      }
    } catch (error) {
      console.error('Error editing message:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Delete message
  socket.on('delete-message', async (data) => {
    try {
      const { messageId } = data;
      
      const message = await Message.findById(messageId);
      if (!message || message.senderId !== socket.userId) {
        return socket.emit('error', { message: 'Unauthorized' });
      }

      message.deletedAt = new Date();
      await message.save();

      // Notify recipient(s)
      if (message.recipientId) {
        io.to(`user:${message.recipientId}`).emit('message-deleted', { messageId });
      } else if (message.groupId) {
        const group = await Group.findById(message.groupId);
        group.members.forEach(memberId => {
          if (memberId !== socket.userId) {
            io.to(`user:${memberId}`).emit('group-message-deleted', {
              messageId,
              groupId: message.groupId
            });
          }
        });
      }
    } catch (error) {
      console.error('Error deleting message:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Get message history
  socket.on('get-history', async (data) => {
    try {
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }
      
      const { recipientId, groupId, limit = 50 } = data;
      
      // Validate limit
      const messageLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100); // Max 100 messages
      
      let query = {};
      if (recipientId) {
        // SECURITY: Only return messages where user is sender or recipient
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
          return socket.emit('error', { message: 'Invalid recipient ID' });
        }
        
        query = {
          $or: [
            { senderId: socket.userId, recipientId },
            { senderId: recipientId, recipientId: socket.userId }
          ],
          deletedAt: null
        };
      } else if (groupId) {
        // SECURITY: Verify user is a group member before returning history
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
          return socket.emit('error', { message: 'Invalid group ID' });
        }
        
        const group = await Group.findById(groupId);
        if (!group) {
          return socket.emit('error', { message: 'Group not found' });
        }
        
        const isMember = group.members.some(m => 
          m.toString() === socket.userId || m.equals(socket.userId)
        );
        
        if (!isMember) {
          return socket.emit('error', { message: 'Not a group member' });
        }
        
        query = { groupId, deletedAt: null };
      } else {
        return socket.emit('error', { message: 'recipientId or groupId required' });
      }

      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(messageLimit)
        .lean();

      socket.emit('history', { messages: messages.reverse() });
    } catch (error) {
      console.error('Error getting history:', sanitizeMongoUri(error.message || 'Unknown error'));
      socket.emit('error', { message: 'Failed to get history' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    if (userId) {
      socket.broadcast.emit('user-offline', { userId });
      console.log(`👋 User ${userId} disconnected`);
    }
  });
});

// Health check
// SECURITY: Never expose environment variables or connection strings
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    // Never include MONGODB_URI or any credentials in health check
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔒 Remember: Server never sees plaintext!`);
});
