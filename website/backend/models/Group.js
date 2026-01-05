import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  encryptedKeys: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    encryptedKey: {
      type: String,
      required: true
      // Shared group key encrypted with member's public key
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Group = mongoose.model('Group', groupSchema);
