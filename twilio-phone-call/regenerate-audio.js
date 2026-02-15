/**
 * Regenerate Telugu and Tamil static audio prompt files using Google TTS
 * Run: node regenerate-audio.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

function getGoogleCredentials() {
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
      return { credentials };
    } catch (e) { /* fall through */ }
  }
  const keyFile = './google-credentials.json';
  if (fs.existsSync(keyFile)) {
    return { keyFilename: keyFile };
  }
  return null;
}

const PROMPTS = {
  // Telugu prompts
  welcome_telugu: 'విద్యా వాణి కి స్వాగతం! మీ విద్యా సహాయకురాలిని నేను.',
  menu_telugu: 'దయచేసి ఎంపిక చేసుకోండి. ప్రశ్న అడగడానికి 1 నొక్కండి. రికార్డింగ్ ఆపడానికి 2 నొక్కండి. సమాధానం కోసం 3 నొక్కండి. సారాంశం కోసం 4 నొక్కండి. మెయిన్ మెనూ కోసం 5 నొక్కండి. ఫాలో-అప్ ప్రశ్న కోసం 6 నొక్కండి. అధ్యాయ వివరణ కోసం 7 నొక్కండి. వివరణ ఆపడానికి 8 నొక్కండి. కాల్ ముగించడానికి 9 నొక్కండి.',
  ask_question_telugu: 'దయచేసి బీప్ తర్వాత మీ ప్రశ్నను అడగండి. రికార్డింగ్ ఆపడానికి 2 నొక్కండి.',
  recording_stopped_telugu: 'రికార్డింగ్ ఆపబడింది. సమాధానం కోసం 3 నొక్కండి, లేదా మరో ప్రశ్న అడగడానికి 1 నొక్కండి.',
  question_recorded_telugu: 'మీ ప్రశ్న రికార్డ్ అయింది.',
  question_recorded_options_telugu: 'సమాధానం కోసం 3 నొక్కండి. మరో ప్రశ్న అడగడానికి 1 నొక్కండి. అదనపు వివరాలు జోడించడానికి 6 నొక్కండి.',
  processing_telugu: 'మీ ప్రశ్నను ఏ.ఐ. తో ప్రాసెస్ చేస్తున్నాము. దయచేసి వేచి ఉండండి.',
  after_answer_telugu: 'మరో ప్రశ్న అడగడానికి 1 నొక్కండి. ఫాలో-అప్ ప్రశ్న కోసం 6 నొక్కండి. అధ్యాయ వివరణ కోసం 7 నొక్కండి. కాల్ ముగించడానికి 9 నొక్కండి.',
  no_question_telugu: 'ఏ ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట 1 నొక్కి మీ ప్రశ్నను అడగండి.',
  still_processing_telugu: 'మీ ప్రశ్న ఇంకా ప్రాసెస్ అవుతోంది. దయచేసి కొన్ని సెకన్లు ఆగి 3 మళ్ళీ నొక్కండి.',
  summary_request_telugu: 'మీ అభ్యాస సారాంశం తయారు చేస్తున్నాము. దయచేసి వేచి ఉండండి.',
  followup_prompt_telugu: 'దయచేసి బీప్ తర్వాత మీ అదనపు వివరాలు చెప్పండి. రికార్డింగ్ ఆపడానికి 2 నొక్కండి.',
  followup_recorded_telugu: 'మీ ఫాలో-అప్ రికార్డ్ అయింది. సమాధానం కోసం 3 నొక్కండి.',
  no_previous_telugu: 'మునుపటి ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ఒక ప్రశ్న అడగండి.',
  goodbye_telugu: 'విద్యా వాణి వాడినందుకు ధన్యవాదాలు. శుభం!',
  invalid_option_telugu: 'చెల్లని ఎంపిక. దయచేసి మళ్ళీ ప్రయత్నించండి.',
  ai_error_telugu: 'ఏ.ఐ. సేవ అందుబాటులో లేదు. దయచేసి తర్వాత ప్రయత్నించండి.',
  db_error_telugu: 'డేటాబేస్ సేవ అందుబాటులో లేదు.',
  general_error_telugu: 'లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
  chapter_explain_telugu: 'దయచేసి మీరు అప్‌లోడ్ చేసిన పుస్తకం నుండి ఏ అధ్యాయాన్ని వివరించాలో చెప్పండి. బీప్ తర్వాత మాట్లాడండి. రికార్డింగ్ ఆపడానికి 3 నొక్కండి.',
  chapter_processing_telugu: 'మీ అధ్యాయ అభ్యర్థన ప్రాసెస్ చేయబడుతోంది. దయచేసి వేచి ఉండండి.',
  chapter_recorded_telugu: 'ధన్యవాదాలు. మీ అధ్యాయ అభ్యర్థన ప్రాసెస్ చేయబడుతోంది.',
  no_documents_telugu: 'ఇంకా ఏ పత్రాలు అప్‌లోడ్ చేయబడలేదు. దయచేసి మొదట డాష్‌బోర్డ్ ద్వారా పుస్తకాన్ని అప్‌లోడ్ చేయండి.',
  paused_explanation_telugu: 'వివరణ ఆపబడింది. ఇప్పుడు మీరు నోట్స్ తీసుకోవచ్చు. వివరణ కొనసాగించడానికి 7 నొక్కండి, లేదా మెయిన్ మెనూ కోసం 5 నొక్కండి.',
  continue_explanation_telugu: 'అధ్యాయ వివరణ కొనసాగుతోంది. మళ్ళీ ఆపడానికి 8 నొక్కండి.',
  after_chapter_telugu: 'మరొక అధ్యాయం కోసం 7 నొక్కండి, ప్రశ్న అడగడానికి 1 నొక్కండి, లేదా కాల్ ముగించడానికి 9 నొక్కండి.',

  // Tamil prompts  
  welcome_tamil: 'வித்யா வாணிக்கு வரவேற்கிறோம்! நான் உங்கள் கல்வி உதவியாளர்.',
  menu_tamil: 'தயவுசெய்து ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும். கேள்வி கேட்க 1 அழுத்தவும். பதிவை நிறுத்த 2 அழுத்தவும். பதிலுக்கு 3 அழுத்தவும். சுருக்கத்திற்கு 4 அழுத்தவும். பிரதான மெனுவுக்கு 5 அழுத்தவும். பின்தொடர் கேள்விக்கு 6 அழுத்தவும். அத்தியாய விளக்கத்திற்கு 7 அழுத்தவும். விளக்கத்தை இடைநிறுத்த 8 அழுத்தவும். அழைப்பை முடிக்க 9 அழுத்தவும்.',
  ask_question_tamil: 'தயவுசெய்து பீப் ஒலிக்குப் பிறகு உங்கள் கேள்வியைக் கேளுங்கள். பதிவை நிறுத்த 2 அழுத்தவும்.',
  recording_stopped_tamil: 'பதிவு நிறுத்தப்பட்டது. பதிலுக்கு 3 அழுத்தவும், அல்லது மற்றொரு கேள்வி கேட்க 1 அழுத்தவும்.',
  question_recorded_tamil: 'உங்கள் கேள்வி பதிவு செய்யப்பட்டது.',
  question_recorded_options_tamil: 'பதிலுக்கு 3 அழுத்தவும். மற்றொரு கேள்வி கேட்க 1 அழுத்தவும். கூடுதல் விவரங்களைச் சேர்க்க 6 அழுத்தவும்.',
  processing_tamil: 'உங்கள் கேள்வியை ஏ.ஐ. மூலம் செயலாக்குகிறோம். தயவுசெய்து காத்திருங்கள்.',
  after_answer_tamil: 'மற்றொரு கேள்வி கேட்க 1 அழுத்தவும். பின்தொடர் கேள்விக்கு 6 அழுத்தவும். அத்தியாய விளக்கத்திற்கு 7 அழுத்தவும். அழைப்பை முடிக்க 9 அழுத்தவும்.',
  no_question_tamil: 'கேள்வி எதுவும் கிடைக்கவில்லை. முதலில் 1 அழுத்தி உங்கள் கேள்வியைக் கேளுங்கள்.',
  still_processing_tamil: 'உங்கள் கேள்வி இன்னும் செயலாக்கப்படுகிறது. சில வினாடிகள் காத்திருந்து 3 மீண்டும் அழுத்தவும்.',
  summary_request_tamil: 'உங்கள் கற்றல் சுருக்கத்தை தயாரிக்கிறோம். தயவுசெய்து காத்திருங்கள்.',
  followup_prompt_tamil: 'தயவுசெய்து பீப் ஒலிக்குப் பிறகு உங்கள் கூடுதல் விவரங்களைச் சொல்லுங்கள். பதிவை நிறுத்த 2 அழுத்தவும்.',
  followup_recorded_tamil: 'உங்கள் பின்தொடர் பதிவு செய்யப்பட்டது. பதிலுக்கு 3 அழுத்தவும்.',
  no_previous_tamil: 'முந்தைய கேள்வி கிடைக்கவில்லை. முதலில் ஒரு கேள்வி கேளுங்கள்.',
  goodbye_tamil: 'வித்யா வாணியைப் பயன்படுத்தியதற்கு நன்றி. வணக்கம்!',
  invalid_option_tamil: 'தவறான விருப்பம். தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
  ai_error_tamil: 'ஏ.ஐ. சேவை கிடைக்கவில்லை. தயவுசெய்து பின்னர் முயற்சிக்கவும்.',
  db_error_tamil: 'தரவுத்தள சேவை கிடைக்கவில்லை.',
  general_error_tamil: 'பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
  chapter_explain_tamil: 'நீங்கள் பதிவேற்றிய புத்தகத்தில் எந்த அத்தியாயத்தை விளக்க வேண்டும் என்று சொல்லுங்கள். பீப் ஒலிக்குப் பிறகு பேசுங்கள். பதிவை நிறுத்த 3 அழுத்தவும்.',
  chapter_processing_tamil: 'உங்கள் அத்தியாய கோரிக்கை செயலாக்கப்படுகிறது. தயவுசெய்து காத்திருங்கள்.',
  chapter_recorded_tamil: 'நன்றி. உங்கள் அத்தியாய கோரிக்கை செயலாக்கப்படுகிறது.',
  no_documents_tamil: 'இதுவரை ஆவணங்கள் எதுவும் பதிவேற்றப்படவில்லை. முதலில் டாஷ்போர்டு வழியாக ஒரு புத்தகத்தைப் பதிவேற்றவும்.',
  paused_explanation_tamil: 'விளக்கம் இடைநிறுத்தப்பட்டது. இப்போது குறிப்புகள் எடுக்கலாம். விளக்கத்தைத் தொடர 7 அழுத்தவும், அல்லது பிரதான மெனுவுக்கு 5 அழுத்தவும்.',
  continue_explanation_tamil: 'அத்தியாய விளக்கம் தொடர்கிறது. மீண்டும் இடைநிறுத்த 8 அழுத்தவும்.',
  after_chapter_tamil: 'மற்றொரு அத்தியாயத்திற்கு 7 அழுத்தவும், கேள்வி கேட்க 1 அழுத்தவும், அல்லது அழைப்பை முடிக்க 9 அழுத்தவும்.'
};

async function regenerateAll() {
  const creds = getGoogleCredentials();
  if (!creds) {
    console.error('❌ No Google credentials found! Make sure google-credentials.json exists or GOOGLE_CREDENTIALS env is set.');
    process.exit(1);
  }

  const ttsClient = new textToSpeech.TextToSpeechClient(creds);
  const audioDir = path.join(__dirname, 'audio');

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const entries = Object.entries(PROMPTS);
  console.log(`🎙️ Regenerating ${entries.length} audio files...`);

  for (const [name, text] of entries) {
    const langCode = name.includes('telugu') ? 'te-IN' : 'ta-IN';
    const voiceName = langCode === 'te-IN' ? 'te-IN-Standard-A' : 'ta-IN-Standard-A';
    const filePath = path.join(audioDir, `${name}.mp3`);

    try {
      const request = {
        input: { text },
        voice: { languageCode: langCode, name: voiceName, ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 0.0 }
      };

      const [response] = await ttsClient.synthesizeSpeech(request);
      await util.promisify(fs.writeFile)(filePath, response.audioContent, 'binary');
      const size = fs.statSync(filePath).size;
      console.log(`  ✅ ${name}.mp3 (${size} bytes)`);
    } catch (error) {
      console.error(`  ❌ ${name}.mp3: ${error.message}`);
    }
  }

  console.log('\n✅ Audio regeneration complete!');
}

regenerateAll();
