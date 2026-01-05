# 🔐 End-to-End Encrypted Messaging Website

A secure, web-based messaging platform with true end-to-end encryption. Messages are encrypted on your device before sending - even the server cannot read them.

## ✨ Features

- 🔒 **True End-to-End Encryption** - Messages encrypted client-side
- 👤 **Anonymous Login** - No email or phone required
- 💬 **One-to-One Chat** - Private conversations
- 👥 **Group Chat** - Encrypted group messaging
- ✏️ **Message Editing** - Edit sent messages
- 🗑️ **Message Deletion** - Delete messages
- ✅ **Read Receipts** - See when messages are read
- ⌨️ **Typing Indicators** - See when someone is typing
- 📎 **File Attachments** - Encrypted file sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Git

### Local Development

1. **Clone and install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Set up environment variables**

Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

3. **Start the servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

4. **Open your browser**
- Navigate to `http://localhost:5173`
- Create a nickname (no registration needed!)
- Start chatting securely!

## 📦 Deploy to GitHub Pages

See [README_DEPLOYMENT.md](README_DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**
1. Push code to GitHub
2. Enable GitHub Pages in repository settings
3. Deploy backend separately (Railway/Render)
4. Set environment variables in GitHub Secrets
5. Done! 🎉

**Note**: The frontend requires a running backend server. Deploy backend first, then update `VITE_API_URL` and `VITE_WS_URL`.

## 📁 Project Structure

```
website/
├── backend/
│   ├── server.js          # Express + Socket.io server
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── middleware/        # Server middleware
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Encryption utilities
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.jsx        # Main app component
│   └── public/            # Static assets
├── ARCHITECTURE.md        # System architecture
├── ENCRYPTION_DESIGN.md   # Encryption details
└── DEPLOYMENT.md          # Deployment guide
```

## 🔐 How Encryption Works

1. **Key Generation**: Each user gets a unique cryptographic key pair
2. **Message Encryption**: Messages encrypted on your device before sending
3. **Key Exchange**: Public keys shared, private keys stay on device
4. **Decryption**: Only recipients can decrypt with their private key

**The server never sees plaintext messages or encryption keys!**

## 🛡️ Security Features

- ✅ Client-side encryption (Web Crypto API)
- ✅ AES-256-GCM encryption
- ✅ ECDH key exchange
- ✅ No plaintext storage
- ✅ Keys never sent to server
- ✅ Authenticated encryption

## 📚 Learn More

- [Architecture](ARCHITECTURE.md) - System design
- [Encryption Design](ENCRYPTION_DESIGN.md) - How encryption works
- [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- [Security Checklist](SECURITY_CHECKLIST.md) - Security best practices

## ⚠️ Important Security Notes

1. **Keys are stored in browser localStorage** - Clear browser data = lost keys
2. **No key recovery** - If you lose your device, you lose access (by design)
3. **Metadata is visible** - Server knows who talks to whom (but not what)
4. **Use HTTPS in production** - Always use encrypted connections

## 🆓 Free Tier Services Used

- **Frontend Hosting**: Vercel (free)
- **Backend Hosting**: Railway or Render (free tier)
- **Database**: MongoDB Atlas (512MB free)
- **All code**: Open source, no paid dependencies

## 🤝 Contributing

This is a learning project! Feel free to:
- Report bugs
- Suggest improvements
- Add features
- Improve documentation

## 📝 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

Built with:
- React + Vite
- Node.js + Express
- Socket.io
- MongoDB Atlas
- Web Crypto API

---

**Remember**: This is for educational purposes. For production use, consider security audits and additional hardening.
