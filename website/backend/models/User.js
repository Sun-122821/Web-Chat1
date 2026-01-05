import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  publicKey: {
    type: String,
    required: true
    // This is the user's public key for encryption
    // Private key NEVER stored on server
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);
