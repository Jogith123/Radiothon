# Vidya Vani — Knowledge at Your Call

> AI-powered educational voice assistant that makes learning accessible through simple phone calls.
> No internet, no smartphone, no app — just dial, ask, and learn.

![Pipeline](twilio-phone-call/assets/pipeline.png)

---

## Problem Statement

Millions of students in rural and underserved areas lack reliable internet or smartphones. Vidya Vani bridges the digital divide by turning **any phone** (landline or mobile) into a 24/7 AI tutor — answering curriculum questions, explaining chapters, and tracking learning progress, all through voice.

---

## Architecture

```
┌──────────────┐     PSTN / VoIP      ┌──────────────────────────────────────────────────────┐
│   Student    │ ───────────────────▶  │              Twilio Voice Gateway                    │
│  (any phone) │ ◀───────────────────  │  IVR menu · Recording · TwiML webhooks               │
└──────────────┘                       └────────────┬────────────────────────────┬─────────────┘
                                                    │  HTTP callbacks            │
                                       ┌────────────▼────────────┐              │
                                       │   Node.js / Express     │              │
                                       │   Backend (Railway)     │              │
                                       │                         │              │
                                       │  ┌───────────────────┐  │   WebSocket  │
                                       │  │ AI Provider Layer │  │◀─────────────┘
                                       │  │  OpenAI (primary)  │  │
                                       │  │  Gemini (fallback) │  │
                                       │  └───────┬───────────┘  │
                                       │          │              │
                                       │  ┌───────▼───────────┐  │       ┌─────────────────────┐
                                       │  │   RAG Service     │──│──────▶│   MongoDB Atlas      │
                                       │  │  (chunked docs)   │  │       │  Q&A history · RAG   │
                                       │  └───────────────────┘  │       │  Subject tagging     │
                                       │                         │       └─────────────────────┘
                                       │  ┌───────────────────┐  │
                                       │  │  Google Cloud     │  │       ┌─────────────────────┐
                                       │  │  STT / TTS /      │  │       │  React Dashboard     │
                                       │  │  Translation      │──│──────▶│  (Vercel)            │
                                       │  └───────────────────┘  │  WS   │  Metrics · History   │
                                       └─────────────────────────┘       └─────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Telephony** | Twilio Voice | IVR, call routing, recording |
| **Backend** | Node.js, Express | API server, IVR logic, WebSocket |
| **AI (primary)** | OpenAI GPT-4o-mini | Question answering, summarisation, subject classification |
| **AI (fallback)** | Google Gemini 2.5 Flash | Automatic fallback when OpenAI is unavailable |
| **Speech-to-Text** | Google Cloud STT | Transcription in English, Hindi, Telugu, Tamil |
| **Text-to-Speech** | Google Cloud TTS | Natural voice responses |
| **Translation** | Google Cloud Translate | Cross-language support |
| **Knowledge Base** | RAG (chunked PDF/DOCX) | Curriculum-grounded answers via retrieval-augmented generation |
| **Database** | MongoDB Atlas | Q&A history, subject tags, RAG document store |
| **Frontend** | React 19, Vite, Tailwind CSS 4 | Admin dashboard with real-time metrics |
| **Auth** | Firebase (Google OAuth) | Dashboard authentication |
| **Hosting** | Railway (backend) · Vercel (frontend) | Production deployment |

---

## Features

- **Voice Q&A** — Ask any curriculum question; get an AI-generated spoken answer
- **Multi-language** — English, Hindi, Telugu, Tamil (auto language selection via IVR)
- **RAG-grounded answers** — Upload study materials (PDF/DOCX); AI answers are grounded in your content
- **Chapter explanations** — Name a chapter and get a structured spoken explanation with pause/resume
- **Subject classification** — Every question is auto-tagged (Physics, Chemistry, Biology, Maths, etc.)
- **Subject-wise summaries** — Press 4 to hear a summary of your recent learning grouped by subject
- **Real-time dashboard** — Live call metrics, activity feed, call history, and analytics charts via WebSocket
- **Pause/Resume** — Long explanations are split into segments; press 1 to continue, 9 to stop

### IVR Menu (after language selection)

| Key | Action |
|-----|--------|
| **1** | Ask a question (record → transcribe → AI answer → speak) |
| **3** | Repeat/get last answer |
| **4** | Get subject-wise learning summary |
| **5** | Chapter explanation (record chapter name → structured explanation) |
| **9** | End call |

---

## Project Structure

```
├── frontend-react/          # React dashboard (Vite + Tailwind CSS 4)
│   ├── src/
│   │   ├── api/             # REST & RAG API clients
│   │   ├── components/      # UI components (auth, common, dashboard, history, layout)
│   │   ├── context/         # Auth, Theme, WebSocket providers
│   │   ├── hooks/           # React Query hooks (call history, session, status)
│   │   ├── lib/             # Firebase config
│   │   └── pages/           # Dashboard, Analytics, CallHistory, LiveCalls, etc.
│   ├── .env.example         # Frontend env template
│   └── package.json
│
├── twilio-phone-call/       # Node.js IVR backend
│   ├── server.js            # Main Express server + Twilio IVR routes
│   ├── config/              # Language configuration
│   ├── database/            # MongoDB connection
│   ├── models/              # Mongoose schemas (History, Admin)
│   ├── services/
│   │   ├── aiProviderService.js   # AI routing (OpenAI primary, Gemini fallback)
│   │   ├── openaiService.js       # OpenAI GPT integration
│   │   ├── geminiService.js       # Google Gemini integration
│   │   ├── ragService.js          # RAG document chunking & retrieval
│   │   ├── speechService.js       # Google Cloud TTS
│   │   ├── translationService.js  # Google Cloud Translation
│   │   ├── historyService.js      # MongoDB Q&A history
│   │   └── websocketService.js    # Real-time dashboard updates
│   ├── audio/               # Pre-generated TTS prompts (Telugu, Tamil)
│   ├── uploads/             # RAG document uploads
│   ├── .env.example         # Backend env template
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js **≥ 18** (20+ recommended)
- MongoDB Atlas account (or local MongoDB)
- Twilio account with a phone number
- Google Cloud project with **Speech-to-Text**, **Text-to-Speech**, and **Translation** APIs enabled
- OpenAI API key (or Gemini API key as fallback)

### 1. Clone & Install

```bash
git clone https://github.com/Jogith123/Nxtwave_X_OpenABuildathon..git
cd Nxtwave_X_OpenABuildathon.

# Backend
cd twilio-phone-call
npm install

# Frontend
cd ../frontend-react
npm install
```

### 2. Configure Environment

```bash
# Backend
cd twilio-phone-call
cp .env.example .env
cp google-credentials.json.example google-credentials.json
# Fill in your actual API keys and credentials in .env
# Place your Google Cloud service account JSON in google-credentials.json

# Frontend
cd ../frontend-react
cp .env.example .env.local
# Fill in Firebase and backend URL values
```

### 3. Start the Backend

```bash
cd twilio-phone-call
npm start                   # Starts Express on port 3000
```

For local development with Twilio, expose via [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Then set the Twilio webhook to `https://<your-ngrok>.ngrok.io/ivr/welcome`.

### 4. Start the Frontend

```bash
cd frontend-react
npm run dev                 # Vite dev server on port 5173
```

### 5. Upload Study Materials (optional)

Use the dashboard **Content Library** page or the REST API to upload PDF/DOCX files. The RAG service chunks and stores them in MongoDB for retrieval-augmented answers.

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | [Railway](https://railway.app) | Set env vars via Railway dashboard; auto-deploys from `working-rag` branch |
| Frontend | [Vercel](https://vercel.com) | Set `VITE_BACKEND_URL` and `VITE_WS_URL` in Vercel env settings |

---

## Environment Variables Reference

### Backend (`twilio-phone-call/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio phone number |
| `BASE_URL` | Yes | Public URL for Twilio webhooks |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o-mini`) |
| `GEMINI_API_KEY` | No* | Gemini key (fallback if OpenAI absent) |
| `GOOGLE_TTS_KEY_FILE` | Yes | Path to Google Cloud credentials JSON |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `PORT` | No | Server port (default: `3000`) |

\* At least one of `OPENAI_API_KEY` or `GEMINI_API_KEY` is required.

### Frontend (`frontend-react/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_BACKEND_URL` | Yes | Backend API base URL |
| `VITE_WS_URL` | Yes | WebSocket URL |

---

## License

ISC

---

**Built for inclusive, multilingual education — bridging the digital divide one phone call at a time.**
