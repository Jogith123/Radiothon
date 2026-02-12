// AI Provider Service - Manages AI provider selection and responses
const openaiService = require('./openaiService');
const geminiService = require('./geminiService');

let activeProvider = 'openai'; // 'openai' or 'gemini'

async function initializeAIProvider(providerType) {
  try {
    // Auto-detect: prefer Gemini if GEMINI_API_KEY exists, otherwise OpenAI
    if (!providerType) {
      providerType = process.env.GEMINI_API_KEY ? 'gemini' : 'openai';
    }

    if (providerType === 'gemini') {
      const result = geminiService.initializeGemini();
      if (result) {
        activeProvider = 'gemini';
        return true;
      }
      // Fall through to OpenAI if Gemini fails
    }
    
    const result = openaiService.initializeOpenAI();
    if (result) {
      activeProvider = 'openai';
      return true;
    }
    
    // Last resort: try Gemini if we haven't yet
    if (providerType !== 'gemini') {
      const gemResult = geminiService.initializeGemini();
      if (gemResult) {
        activeProvider = 'gemini';
        return true;
      }
    }

    console.warn('⚠️  No AI provider could be initialized');
    return false;
  } catch (error) {
    console.error('Error initializing AI provider:', error);
    return false;
  }
}

function getActiveProvider() {
  return activeProvider;
}

async function generateAnswer(question, context = '') {
  try {
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.generateAnswer(question, context);
    }
    
    if (openaiService.isInitialized()) {
      return await openaiService.generateAnswer(question, context);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
}

async function classifySubject(text) {
  try {
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.classifySubject(text);
    }
    
    if (openaiService.isInitialized()) {
      return await openaiService.classifySubject(text);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error classifying subject:', error);
    throw error;
  }
}

async function generateSummary(subjectName, history) {
  try {
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.generateSummary(subjectName, history);
    }
    
    if (openaiService.isInitialized()) {
      return await openaiService.generateSummary(subjectName, history);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

function isAnyProviderInitialized() {
  if (activeProvider === 'gemini' && geminiService.isInitialized()) return true;
  if (openaiService.isInitialized()) return true;
  return false;
}

module.exports = {
  initializeAIProvider,
  getActiveProvider,
  isAnyProviderInitialized,
  generateAnswer,
  classifySubject,
  generateSummary
};
