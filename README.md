<div align="center">

# 📞 Vidya Vani — Knowledge at Your Call

### *AI-powered educational voice assistant that makes learning accessible through simple phone calls*

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-ISC-orange.svg)](LICENSE)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-blueviolet.svg)](https://railway.app)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black.svg)](https://vercel.com)

**No internet • No smartphone • No app — just dial, ask, and learn** 🎓

[Features](#-key-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Docs](#-rest-api) • [Deployment](#-deployment)

</div>

---

## 🎯 Problem Statement

Millions of students in rural and underserved areas lack reliable internet or smartphones. **Vidya Vani** bridges the digital divide by turning **any phone** (landline or mobile) into a 24/7 AI tutor — answering curriculum questions, explaining chapters, and tracking learning progress, all through voice.

### Why It Matters
- 🌍 **700M+ people** in India don't have smartphones
- 📱 **Basic feature phones** are still the primary communication device in rural areas
- 🎓 **Educational content** should be accessible to everyone, regardless of technology
- 🔊 **Voice-first approach** removes literacy barriers and supports regional languages

---

## ✨ Key Features

### 🎤 Voice-Based Q&A
Ask any curriculum question and get an AI-generated spoken answer in your preferred language (English, Hindi, Telugu, Tamil).

### 🌐 Multi-Language Support
- **4 Languages**: English, Hindi, Telugu, Tamil
- **Auto-detection**: Transcribes and translates in real-time
- **Native TTS**: Natural-sounding voice responses

### 📚 RAG-Grounded Answers
- Upload study materials (PDF/DOCX/TXT)
- AI answers are grounded in your uploaded content
- Retrieval-Augmented Generation ensures accuracy

### 📖 Chapter Explanations
- Request detailed explanations of specific chapters
- Structured, segment-by-segment delivery
- Pause/resume functionality for note-taking

### 🏷️ Intelligent Classification
- Every question auto-tagged by subject (Physics, Chemistry, Biology, etc.)
- Subject-wise learning summaries
- Track progress across multiple topics

### 📊 Real-Time Dashboard
- Live call monitoring with WebSocket updates
- Activity feed showing questions and answers
- Comprehensive analytics and call history
- Performance metrics (STT, LLM, TTS latency)

### ⏸️ Pause & Resume
Long explanations are split into manageable segments with pause/resume control via phone keypad.

---

## 🏗️ Architecture

```
┌──────────────┐     PSTN / VoIP      ┌────────────────────────────────────────┐
│   Student    │ ───────────────────▶  │     Twilio Voice Gateway               │
│  (any phone) │ ◀───────────────────  │  IVR • Recording • TwiML Webhooks      │
└──────────────┘                       └──────────┬────────────────┬────────────┘
                                                  │                │
                                     ┌────────────▼────────────┐   │
                                     │  Node.js + Express      │   │
                                     │  Backend (Railway)      │   │
                                     │                         │   │
                                     │  ┌──────────────────┐   │   │ WebSocket
                                     │  │  AI Provider     │   │◀──┘
                                     │  │  • OpenAI (1°)   │   │
                                     │  │  • Gemini (2°)   │   │
                                     │  └────────┬─────────┘   │
                                     │           │             │
                                     │  ┌────────▼─────────┐   │       ┌──────────────┐
                                     │  │  RAG Service     │───│──────▶│  MongoDB     │
                                     │  │  Vector Search   │   │       │  Atlas       │
                                     │  └──────────────────┘   │       │              │
                                     │                         │       │ • History    │
                                     │  ┌──────────────────┐   │       │ • RAG Docs   │
                                     │  │  Google Cloud    │   │       │ • Analytics  │
                                     │  │  • STT           │   │       └──────────────┘
                                     │  │  • TTS           │───┤
                                     │  │  • Translation   │   │       ┌──────────────┐
                                     │  └──────────────────┘   │       │   React      │
                                     └─────────────────────────┘──────▶│  Dashboard   │
                                                                  WS   │  (Vercel)    │
                                                                       └──────────────┘
```

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **☎️ Telephony** | ![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=flat&logo=twilio&logoColor=white) |
| **🔙 Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white) |
| **🤖 AI** | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white) ![Google Gemini](https://img.shields.io/badge/Gemini-4285F4?style=flat&logo=google&logoColor=white) |
| **🗣️ Speech** | ![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=google-cloud&logoColor=white) STT/TTS/Translate |
| **💾 Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white) Atlas |
| **⚛️ Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white) |
| **🔐 Auth** | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black) Google OAuth |
| **☁️ Hosting** | ![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat&logo=railway&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) |

</div>

### Detailed Stack

#### Backend
- **Node.js 20+** - Server runtime
- **Express.js** - REST API & IVR webhooks
- **Twilio Voice API** - Phone call handling & IVR
- **OpenAI GPT-4o-mini** - Primary AI for Q&A and summaries
- **Google Gemini 2.5 Flash** - Automatic fallback AI provider
- **Google Cloud Speech-to-Text** - Multi-language transcription
- **Google Cloud Text-to-Speech** - Natural voice synthesis
- **Google Cloud Translation** - Cross-language support
- **MongoDB Atlas** - Q&A history, RAG document store
- **WebSocket (ws)** - Real-time dashboard updates

#### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **React Query** - Server state management
- **React Router v7** - Client-side routing
- **Recharts** - Analytics charts
- **Firebase** - Google OAuth authentication
- **Lucide React** - Icon library

---

## 📋 Project Structure

```
📦 Nxtwave_X_OpenABuildathon
├── 📁 frontend-react/                 # React Admin Dashboard
│   ├── 📁 src/
│   │   ├── 📁 api/                    # API clients (REST, RAG, WebSocket)
│   │   │   ├── client.js              # Main API client
│   │   │   └── ragClient.js           # RAG service client
│   │   ├── 📁 components/
│   │   │   ├── 📁 auth/               # Protected routes
│   │   │   ├── 📁 common/             # Reusable UI (Button, Card, etc.)
│   │   │   ├── 📁 dashboard/          # Dashboard widgets
│   │   │   ├── 📁 history/            # Call history table & filters
│   │   │   └── 📁 layout/             # Layout (Header, Sidebar)
│   │   ├── 📁 context/                # React Context
│   │   │   ├── AuthContext.jsx       # Firebase auth
│   │   │   ├── ThemeContext.jsx      # Dark mode toggle
│   │   │   └── WebSocketContext.jsx  # Real-time updates
│   │   ├── 📁 hooks/                  # Custom React hooks
│   │   │   └── 📁 api/
│   │   │       ├── useCallHistory.js  # Fetch call history
│   │   │       ├── useCallSession.js  # Active sessions
│   │   │       └── useSystemStatus.js # Backend health
│   │   ├── 📁 lib/                    # Firebase config
│   │   ├── 📁 pages/                  # Route pages
│   │   │   ├── Dashboard.jsx         # Main overview
│   │   │   ├── LiveCalls.jsx         # Real-time call monitoring
│   │   │   ├── Analytics.jsx         # Charts & stats
│   │   │   ├── CallHistory.jsx       # Historical data
│   │   │   ├── ContentLibrary.jsx    # RAG document manager
│   │   │   └── Login.jsx             # Google sign-in
│   │   ├── App.jsx                    # Main app entry
│   │   ├── main.jsx                   # React root
│   │   └── index.css                  # Global styles
│   ├── .env.example                   # Frontend env template
│   ├── package.json
│   └── vite.config.js
│
├── 📁 twilio-phone-call/              # Node.js IVR Backend
│   ├── 📁 config/
│   │   └── languageConfig.js          # Multi-language prompts
│   ├── 📁 database/
│   │   └── connection.js              # MongoDB setup
│   ├── 📁 models/
│   │   ├── History.js                 # Q&A history schema
│   │   └── Admin.js                   # Admin users schema
│   ├── 📁 services/
│   │   ├── aiProviderService.js       # AI routing (OpenAI/Gemini)
│   │   ├── openaiService.js           # OpenAI GPT integration
│   │   ├── geminiService.js           # Google Gemini integration
│   │   ├── ragService.js              # RAG chunking & vector search
│   │   ├── speechService.js           # Google Cloud TTS/STT
│   │   ├── translationService.js      # Google Cloud Translation
│   │   ├── historyService.js          # MongoDB Q&A operations
│   │   └── websocketService.js        # Real-time broadcast
│   ├── 📁 audio/                      # Pre-generated TTS prompts
│   │   ├── welcome_telugu.mp3
│   │   ├── welcome_tamil.mp3
│   │   └── ... (56 audio files)
│   ├── 📁 uploads/                    # RAG document uploads
│   ├── server.js                      # Main Express server
│   ├── .env.example                   # Backend env template
│   └── package.json
│
├── README.md                          # This file
└── package.json                       # Root package.json
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** (20+ recommended) - [Download](https://nodejs.org/)
- ✅ **MongoDB Atlas account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- ✅ **Twilio account** with phone number - [Sign up](https://www.twilio.com/)
- ✅ **Google Cloud project** with STT, TTS, Translation APIs enabled - [Get started](https://console.cloud.google.com/)
- ✅ **OpenAI API key** or **Gemini API key** - [OpenAI](https://platform.openai.com/) | [Gemini](https://ai.google.dev/)
- ✅ **Firebase project** for Google OAuth - [Console](https://console.firebase.google.com/)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Jogith123/Nxtwave_X_OpenABuildathon.git
cd Nxtwave_X_OpenABuildathon
```

### 2️⃣ Backend Setup

```bash
cd twilio-phone-call

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# (Use nano, vim, or your favorite editor)
nano .env
```

#### Required Environment Variables

```env
# Twilio credentials (https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Public URL for Twilio webhooks (use ngrok for local dev)
BASE_URL=https://your-domain.ngrok.io

# AI Provider (at least one required)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

# OR use Gemini as fallback
# GEMINI_API_KEY=your_gemini_api_key

# Google Cloud credentials (place JSON file in root)
GOOGLE_TTS_KEY_FILE=./google-credentials.json

# MongoDB connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/radiothon

# Server port
PORT=3000
```

#### Google Cloud Setup

1. Create a service account in Google Cloud Console
2. Enable **Speech-to-Text**, **Text-to-Speech**, and **Translation** APIs
3. Download the JSON key file
4. Rename it to `google-credentials.json` and place in `twilio-phone-call/` directory

#### Start the Backend

```bash
npm start

# Server will start on http://localhost:3000
```

#### Expose via ngrok (for local development)

```bash
# In a new terminal
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update .env: BASE_URL=https://abc123.ngrok.io
# Configure Twilio webhook: https://abc123.ngrok.io/ivr/welcome
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend-react

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Firebase config
nano .env.local
```

#### Required Frontend Variables

```env
# Firebase credentials (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# Backend API URLs
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000/ws
```

#### Start the Frontend

```bash
npm run dev

# Dashboard will open at http://localhost:5173
```

### 4️⃣ Upload Study Materials

1. Open the dashboard at `http://localhost:5173`
2. Sign in with Google
3. Navigate to **Content Library**
4. Upload PDF, DOCX, or TXT files
5. The RAG service will automatically chunk and index the content

---

## 📞 IVR Menu Flow

### Language Selection (Entry Point)

When a student calls the Twilio number:

```
🔢 Press 1 for English
🔢 Press 2 for Hindi
🔢 Press 3 for Telugu
🔢 Press 4 for Tamil
```

### Main Menu (After Language Selection)

| Key | Action | Description |
|-----|--------|-------------|
| **1** | 🎤 Ask Question | Record a question → AI answers |
| **2** | ⏹️ Stop Recording | End current recording early |
| **3** | 🔁 Repeat Answer | Replay the last answer |
| **4** | 📊 Learning Summary | Subject-wise summary of last 5 questions |
| **5** | 🔄 Return to Menu | Go back to main menu |
| **6** | ➕ Follow-Up | Add more details to last question |
| **7** | 📖 Chapter Explanation | Explain a specific chapter (pause/resume) |
| **8** | ⏸️ Pause Explanation | Pause chapter reading (for note-taking) |
| **9** | 👋 End Call | Goodbye message and hang up |

---

## 🔌 REST API

Base URL: `http://localhost:3000` (or your deployed URL)

### Call History

#### Get All History
```http
GET /api/history
Query Params:
  - phoneNumber (optional)
  - subject (optional)
  - limit (default: 50)
  - skip (default: 0)

Response:
{
  "success": true,
  "count": 42,
  "data": [
    {
      "_id": "...",
      "user_id": "+919876543210",
      "question": "What is photosynthesis?",
      "answer": "Photosynthesis is...",
      "subject": "Biology",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get User History
```http
GET /api/history/:phoneNumber
Query Params:
  - limit (default: 50)
```

### Analytics

#### System Status
```http
GET /api/status

Response:
{
  "success": true,
  "backend": "Online",
  "websocket": "Connected",
  "activeSessions": 3,
  "callsToday": 127,
  "mongodb": true,
  "ai": "OpenAI",
  "openai": true
}
```

#### Analytics Summary
```http
GET /api/analytics/summary

Response:
{
  "success": true,
  "totalCalls": 85,
  "callsTrend": "+12.5%",
  "uniqueStudents": 42,
  "studentsTrend": "+8.3%",
  "avgQuestionsPerUser": "2.0",
  "totalAllTime": 1234
}
```

#### Call Volume (Last 7 Days)
```http
GET /api/analytics/call-volume

Response:
{
  "success": true,
  "data": [
    { "day": "Mon", "calls": 25, "missed": 2 },
    { "day": "Tue", "calls": 30, "missed": 1 },
    ...
  ]
}
```

#### Subject Distribution
```http
GET /api/analytics/subjects

Response:
{
  "success": true,
  "data": [
    { "name": "Physics", "value": 45, "calls": 45 },
    { "name": "Chemistry", "value": 38, "calls": 38 },
    ...
  ]
}
```

### RAG Content Library

#### List Documents
```http
GET /api/rag/library

Response:
{
  "success": true,
  "count": 5,
  "documents": [
    {
      "id": "...",
      "fileName": "Physics_Class10.pdf",
      "subject": "Physics",
      "chunkCount": 45,
      "uploadedAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### Upload Document
```http
POST /api/rag/upload
Content-Type: multipart/form-data

Body:
  - file: <PDF/DOCX/TXT file>
  - subject: Physics

Response:
{
  "success": true,
  "fileName": "Physics_Class10.pdf",
  "chunkCount": 45
}
```

#### Search Documents
```http
POST /api/rag/search
Content-Type: application/json

Body:
{
  "query": "Newton's laws of motion",
  "topK": 5,
  "minSimilarity": 0.2
}

Response:
{
  "success": true,
  "results": [
    {
      "fileName": "Physics_Class10.pdf",
      "chapterTitle": "Laws of Motion",
      "content": "Newton's first law states...",
      "similarity": 0.87
    }
  ]
}
```

#### Generate RAG Answer
```http
POST /api/rag/generate-answer
Content-Type: application/json

Body:
{
  "query": "Explain Newton's third law"
}

Response:
{
  "success": true,
  "query": "Explain Newton's third law",
  "answer": "Newton's third law states...",
  "sources": [
    {
      "fileName": "Physics_Class10.pdf",
      "subject": "Physics",
      "relevanceScore": 0.89
    }
  ],
  "hasContext": true
}
```

#### Delete Document
```http
DELETE /api/rag/content/:docId
```

#### Clear Library
```http
POST /api/rag/clear
```

---

## 🔌 WebSocket Events

Connect to: `ws://localhost:3000/ws` (or `wss://your-domain.com/ws`)

### Events from Server

```javascript
// Call started
{
  "type": "callStarted",
  "data": {
    "callSid": "CAxxxx",
    "from": "+919876543210",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Question transcribed
{
  "type": "questionTranscribed",
  "data": {
    "callSid": "CAxxxx",
    "question": "What is photosynthesis?",
    "language": "en-US"
  }
}

// Answer generated
{
  "type": "answerGenerated",
  "data": {
    "callSid": "CAxxxx",
    "answer": "Photosynthesis is...",
    "subject": "Biology"
  }
}

// Q&A saved
{
  "type": "qaSaved",
  "data": {
    "callSid": "CAxxxx",
    "question": "...",
    "answer": "...",
    "subject": "Biology"
  }
}

// Call ended
{
  "type": "callEnded",
  "data": {
    "callSid": "CAxxxx",
    "duration": 245
  }
}

// Metrics update (every 10 seconds)
{
  "type": "metrics",
  "data": {
    "totalCalls": 127,
    "activeSessions": 3,
    "avgLatency": 2500,
    "sttTime": 800,
    "llmTime": 1200,
    "ttsTime": 500
  }
}
```

---

## 🚀 Deployment

### Backend (Railway)

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Select `twilio-phone-call` as root directory

2. **Configure Environment Variables**
   ```
   Add all variables from .env.example in Railway dashboard
   ```

3. **Add Google Cloud Credentials**
   - Option A: Convert JSON to base64 and decode in startup script
   - Option B: Use Railway's file upload feature

4. **Deploy**
   ```bash
   Railway auto-deploys on git push to main branch
   ```

5. **Update Twilio Webhook**
   - Copy Railway domain: `https://your-app.railway.app`
   - Update Twilio webhook URL: `https://your-app.railway.app/ivr/welcome`

### Frontend (Vercel)

1. **Create Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Import from GitHub
   - Set root directory to `frontend-react`
   - Framework preset: Vite

2. **Configure Environment Variables**
   ```
   Add all VITE_* variables from .env.example
   VITE_BACKEND_URL=https://your-app.railway.app
   VITE_WS_URL=wss://your-app.railway.app/ws
   ```

3. **Deploy**
   ```bash
   Vercel auto-deploys on git push to main branch
   ```

---

## 🔒 Security Best Practices

### Backend
- ✅ Store credentials in environment variables (never commit to git)
- ✅ Use HTTPS for all production webhooks
- ✅ Validate Twilio webhook signatures
- ✅ Rate limit API endpoints
- ✅ Use MongoDB connection string with auth enabled

### Frontend
- ✅ Firebase security rules for authenticated users only
- ✅ CORS configured for specific origins
- ✅ Environment variables prefixed with `VITE_` (publicly exposed)
- ✅ Protected routes require authentication

### Google Cloud
- ✅ Service account with minimum required permissions
- ✅ Restrict API keys to specific services
- ✅ Enable billing alerts

---

## 🐛 Troubleshooting

### Backend Issues

**Error: MongoDB connection failed**
```bash
# Check connection string format
mongodb+srv://username:password@cluster.mongodb.net/database

# Whitelist your IP in MongoDB Atlas Network Access
```

**Error: OpenAI API key invalid**
```bash
# Verify key starts with sk-proj- or sk-
# Check OpenAI dashboard for usage limits
# Ensure GEMINI_API_KEY is set as fallback
```

**Twilio webhook not receiving calls**
```bash
# Verify BASE_URL in .env matches ngrok URL
# Check Twilio webhook configuration
# Ensure ngrok is running: ngrok http 3000
```

**Google Cloud TTS/STT errors**
```bash
# Verify google-credentials.json exists
# Check file path in GOOGLE_TTS_KEY_FILE
# Enable APIs in Google Cloud Console
```

### Frontend Issues

**Firebase auth not working**
```bash
# Check Firebase config in .env.local
# Verify OAuth consent screen is configured
# Enable Google sign-in in Firebase Console
```

**WebSocket connection failed**
```bash
# Verify VITE_WS_URL format: ws://localhost:3000/ws (local) or wss://domain.com/ws (prod)
# Check backend is running and accessible
# Ensure CORS headers allow WebSocket origin
```

**404 on API calls**
```bash
# Verify VITE_BACKEND_URL matches backend server
# Check backend server is running
# Confirm API endpoints exist in server.js
```

---

## 📊 Performance Metrics

### Latency Breakdown
- **Speech-to-Text**: ~800ms (Google Cloud STT)
- **AI Processing**: ~1200ms (OpenAI GPT-4o-mini)
- **Text-to-Speech**: ~500ms (Google Cloud TTS)
- **Total Response Time**: ~2.5 seconds

### Scalability
- Handles **100+ concurrent calls** with proper infrastructure
- **MongoDB Atlas** auto-scales based on load
- **WebSocket** broadcasts to unlimited dashboard clients
- **Railway/Vercel** auto-scaling for backend/frontend

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👥 Team

Built with ❤️ by the **NxtWave x OpenAI Buildathon** team

- **GitHub**: [@Jogith123](https://github.com/Jogith123)
- **Project Link**: [Nxtwave_X_OpenABuildathon](https://github.com/Jogith123/Nxtwave_X_OpenABuildathon)

---

## 🌟 Acknowledgments

- [Twilio](https://www.twilio.com/) - Voice API and telephony infrastructure
- [OpenAI](https://openai.com/) - GPT models for question answering
- [Google Cloud](https://cloud.google.com/) - Speech services and translation
- [MongoDB](https://www.mongodb.com/) - Database and RAG document storage
- [Railway](https://railway.app/) - Backend hosting
- [Vercel](https://vercel.com/) - Frontend hosting
- [NxtWave](https://www.ccbp.in/) - Organizing the buildathon

---

<div align="center">

### 📞 Bridging the digital divide, one phone call at a time

**Made for inclusive, multilingual education**

[⬆ Back to Top](#-vidya-vani--knowledge-at-your-call)

</div>
