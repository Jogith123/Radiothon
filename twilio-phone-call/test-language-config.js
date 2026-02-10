/**
 * Test script for language configuration module
 * Verifies that all prompts are available in all 4 languages
 */

const {
    LANGUAGES,
    PROMPTS,
    getLanguageByDigit,
    getLanguageByCode,
    getPrompt,
    getVoiceConfig,
    isLanguageSupported
} = require('./config/languageConfig');

console.log('🧪 Testing Language Configuration Module\n');

// Test 1: Verify all languages are defined
console.log('Test 1: Verify all languages are defined');
const expectedLanguages = ['1', '2', '3', '4'];
const allLanguagesDefined = expectedLanguages.every(digit => LANGUAGES[digit]);
console.log(`✅ All languages defined: ${allLanguagesDefined}\n`);

// Test 2: Verify language lookup functions
console.log('Test 2: Verify language lookup functions');
const englishByDigit = getLanguageByDigit('1');
console.log(`  getLanguageByDigit('1'): ${englishByDigit?.name}`);

const hindiByCode = getLanguageByCode('hi-IN');
console.log(`  getLanguageByCode('hi-IN'): ${hindiByCode?.name}`);

const isEnglishSupported = isLanguageSupported('en-US');
console.log(`  isLanguageSupported('en-US'): ${isEnglishSupported}\n`);

// Test 3: Verify all prompt keys have translations for all languages
console.log('Test 3: Verify all prompts have translations');
const promptKeys = Object.keys(PROMPTS).filter(key => key !== 'languageSelection');
const languageCodes = ['en-US', 'hi-IN', 'te-IN', 'ta-IN'];

let missingTranslations = [];
promptKeys.forEach(key => {
    languageCodes.forEach(langCode => {
        if (!PROMPTS[key][langCode]) {
            missingTranslations.push(`${key} - ${langCode}`);
        }
    });
});

if (missingTranslations.length === 0) {
    console.log(`✅ All ${promptKeys.length} prompts have translations in all 4 languages`);
} else {
    console.log(`❌ Missing translations:`);
    missingTranslations.forEach(missing => console.log(`   - ${missing}`));
}
console.log();

// Test 4: Test getPrompt function
console.log('Test 4: Test getPrompt function');
const welcomeEnglish = getPrompt('welcome', 'en-US');
const welcomeHindi = getPrompt('welcome', 'hi-IN');
const welcomeTelugu = getPrompt('welcome', 'te-IN');
const welcomeTamil = getPrompt('welcome', 'ta-IN');

console.log(`  English: ${welcomeEnglish.substring(0, 50)}...`);
console.log(`  Hindi: ${welcomeHindi.substring(0, 50)}...`);
console.log(`  Telugu: ${welcomeTelugu.substring(0, 50)}...`);
console.log(`  Tamil: ${welcomeTamil.substring(0, 50)}...\n`);

// Test 5: Test getPrompt with parameters
console.log('Test 5: Test getPrompt with parameters');
const summaryIntro = getPrompt('summaryIntro', 'en-US', { subject: 'Physics', count: 5 });
console.log(`  Summary intro: ${summaryIntro}\n`);

// Test 6: Test getVoiceConfig
console.log('Test 6: Test getVoiceConfig');
languageCodes.forEach(langCode => {
    const voiceConfig = getVoiceConfig(langCode);
    console.log(`  ${langCode}: voice=${voiceConfig.voice}, language=${voiceConfig.language}`);
});
console.log();

// Test 7: Verify language selection prompts
console.log('Test 7: Verify language selection prompts');
console.log(`  Language selection has ${PROMPTS.languageSelection.length} prompts`);
PROMPTS.languageSelection.forEach((prompt, index) => {
    console.log(`  ${index + 1}. ${prompt.text.substring(0, 60)}... (${prompt.language})`);
});
console.log();

// Summary
console.log('═'.repeat(60));
console.log('📊 Test Summary');
console.log('═'.repeat(60));
console.log(`Total languages: ${Object.keys(LANGUAGES).length}`);
console.log(`Total prompt keys: ${promptKeys.length}`);
console.log(`Missing translations: ${missingTranslations.length}`);
console.log(`\n${missingTranslations.length === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}`);
