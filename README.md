# **VIDYA VANI**

### *Knowledge at Your Call*

---

## 🎓 About Vidya Vani

**Vidya Vani** is an AI-powered educational voice assistant that makes learning accessible to everyone through simple phone calls. No internet, no smartphone, no app required—just dial a number, ask your question, and get instant AI-generated answers spoken back to you.

The system bridges the digital divide by providing 24/7 educational support to students in rural and underserved areas who may not have access to computers or smartphones but have basic phone connectivity.

**Key Features:**
- 📞 Works on any phone (landline or mobile)
- 🎤 Voice-based interaction—just speak naturally
- 🤖 AI-powered answers using Google Gemini
- 🔊 High-quality speech recognition (90–95% accuracy)
- 🌍 Accessible anywhere, anytime
- ⚡ Real-time responses in seconds
- 🗣️ **NEW:** Multi-language support (English, Hindi, Telugu, more)
- 💾 **NEW:** Question history stored in MongoDB
- 📚 **NEW:** Automatic subject classification (Physics, Chemistry, Biology, Math)
- 📊 **NEW:** Learning summaries based on your question history

---

## 🏗️ Technology Stack & Architecture

*(same diagram and explanation as before)*

---

## 📦 Quick Installation Guide

### **Step 1: Install Dependencies**
```bash
cd Vidya-Vani/twilio-phone-call
npm install
Step 2: Configure Environment
bash
cp .env.example .env
Edit .env with the following:

TWILIO_ACCOUNT_SID

TWILIO_AUTH_TOKEN

GEMINI_API_KEY

GOOGLE_TTS_KEY_FILE=./google-credentials.json

MONGODB_URI=mongodb://localhost:27017/vidya-vani

LANGUAGE=en-IN (Options: en-IN, hi-IN, te-IN, etc.)

Step 3: Setup MongoDB
(same as previous)

Step 4: Add Google Credentials
Ensure Speech-to-Text and Text-to-Speech APIs are enabled for multiple languages

Update GOOGLE_TTS_KEY_FILE path in .env

Step 5: Start ngrok
bash
ngrok http 3000
Step 6: Configure Twilio Webhook
bash
# Go to Twilio Console → Phone Numbers → Webhook
# Set to: https://<your-ngrok>.ngrok.io/ivr/welcome
Step 7: Start Server
bash
npm run server
🌐 Multi-Language Support
Vidya Vani supports:

English (en-IN)

Hindi (hi-IN)

Telugu (te-IN)

More coming soon (Kannada, Tamil, Marathi)

How it works:

User speaks in their language

Google Speech-to-Text transcribes accordingly

Gemini generates response

Google TTS replies in the same language

To switch languages, update LANGUAGE in your .env:

env
Copy code
LANGUAGE=hi-IN  # For Hindi
📱 How to Use
(same call flow and options)

📚 MongoDB Features
(same classification, history, and summaries)

🎓 Educational Impact
Vidya Vani aims to democratize education by:

Reaching students without internet access

Supporting multiple native languages

Providing 24/7 learning help

Reducing the cost barrier to AI education

Knowledge at Your Call – in your own language, anywhere in the world.

Built with ❤️ for inclusive and multilingual education
 
