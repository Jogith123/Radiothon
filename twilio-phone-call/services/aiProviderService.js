// AI Provider Service - Manages AI provider selection and responses
const openaiService = require('./openaiService');
const geminiService = require('./geminiService');

let activeProvider = 'openai'; // 'openai' or 'gemini'

async function initializeAIProvider(providerType) {
  try {
    // Auto-detect: prefer OpenAI if OPENAI_API_KEY exists, otherwise Gemini
    if (!providerType) {
      providerType = process.env.OPENAI_API_KEY ? 'openai' : 'gemini';
    }

    if (providerType === 'openai') {
      const result = openaiService.initializeOpenAI();
      if (result) {
        activeProvider = 'openai';
        return true;
      }
      // Fall through to Gemini if OpenAI fails
    }
    
    if (providerType === 'gemini' || providerType !== 'openai') {
      const result = geminiService.initializeGemini();
      if (result) {
        activeProvider = 'gemini';
        return true;
      }
    }
    
    // Last resort: try the other provider
    if (providerType === 'openai') {
      const gemResult = geminiService.initializeGemini();
      if (gemResult) {
        activeProvider = 'gemini';
        return true;
      }
    } else {
      const oaiResult = openaiService.initializeOpenAI();
      if (oaiResult) {
        activeProvider = 'openai';
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
    if (activeProvider === 'openai' && openaiService.isInitialized()) {
      return await openaiService.generateAnswer(question, context);
    }
    
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.generateAnswer(question, context);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
}

async function classifySubject(text) {
  try {
    if (activeProvider === 'openai' && openaiService.isInitialized()) {
      return await openaiService.classifySubject(text);
    }
    
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.classifySubject(text);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error classifying subject:', error);
    throw error;
  }
}

async function generateSummary(subjectName, history) {
  try {
    if (activeProvider === 'openai' && openaiService.isInitialized()) {
      return await openaiService.generateSummary(subjectName, history);
    }
    
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.generateSummary(subjectName, history);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

async function explainChapter(chapterRequest, fullContent, fileName) {
  try {
    if (activeProvider === 'openai' && openaiService.isInitialized()) {
      return await openaiService.explainChapter(chapterRequest, fullContent, fileName);
    }
    
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.explainChapter(chapterRequest, fullContent, fileName);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error explaining chapter:', error);
    throw error;
  }
}

async function generateSubjectWiseSummary(subjectGroups) {
  try {
    if (activeProvider === 'openai' && openaiService.isInitialized()) {
      return await openaiService.generateSubjectWiseSummary(subjectGroups);
    }
    
    if (activeProvider === 'gemini' && geminiService.isInitialized()) {
      return await geminiService.generateSubjectWiseSummary(subjectGroups);
    }
    
    throw new Error('No AI provider is initialized');
  } catch (error) {
    console.error('Error generating subject-wise summary:', error);
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
  generateSummary,
  generateSubjectWiseSummary,
  explainChapter
};
