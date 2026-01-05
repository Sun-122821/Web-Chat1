import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // null if group message
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
    // null if one-to-one message
  },
  encryptedMessage: {
    type: String,
    required: true
    // Base64-encoded encrypted message blob
    // Server CANNOT decrypt this
  },
  encryptedKey: {
    type: String
    // Encrypted AES key (for one-to-one messages)
    // null for group messages (uses shared key)
  },
  iv: {
    type: String,
    required: true
    // Initialization vector for AES-GCM
  },
  authTag: {
    type: String,
    required: true
    // Authentication tag from AES-GCM
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
    // Soft delete - message marked as deleted but not removed
  }
});

// Indexes for faster queries
messageSchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });
messageSchema.index({ groupId: 1, timestamp: -1 });

export const Message = mongoose.model('Message', messageSchema);
