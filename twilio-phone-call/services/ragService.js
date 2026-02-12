/**
 * RAG (Retrieval-Augmented Generation) Service
 * MongoDB-backed document store with text chunking and search
 */

const { getDatabase, isConnected } = require('../database/connection');
const { ObjectId } = require('mongodb');

const COLLECTION = 'rag_documents';
const CHUNK_SIZE = 500; // characters per chunk

/**
 * Get the rag_documents collection
 */
function getCollection() {
  const db = getDatabase();
  if (!db) throw new Error('Database not connected');
  return db.collection(COLLECTION);
}

/**
 * Split text into overlapping chunks
 */
function chunkText(text, chunkSize = CHUNK_SIZE) {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep last portion for overlap
      const words = current.split(' ');
      current = words.slice(-10).join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Detect chapters/sections in text
 */
function detectChapters(text) {
  const chapterPattern = /^(chapter|section|unit|module|part)\s*[\d.:]+\s*.*/gim;
  const matches = [...text.matchAll(chapterPattern)];
  return matches.map(m => ({
    title: m[0].trim(),
    position: m.index
  }));
}

/**
 * Upload and store a document
 */
async function uploadDocument(fileName, content, subject = 'General', fileType = 'txt') {
  const col = getCollection();
  const chunks = chunkText(content);
  const chapters = detectChapters(content);
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  const doc = {
    fileName,
    subject,
    fileType,
    content,
    contentLength: content.length,
    wordCount,
    chunks,
    totalChunks: chunks.length,
    chapters,
    chapterTitles: chapters.map(c => c.title),
    uploadedAt: new Date(),
    updatedAt: new Date()
  };

  const result = await col.insertOne(doc);
  return {
    success: true,
    docId: result.insertedId.toString(),
    fileName,
    subject,
    totalChunks: chunks.length,
    contentLength: content.length,
    chapters: chapters.length
  };
}

/**
 * Get all documents (metadata only)
 */
async function getLibrary() {
  const col = getCollection();
  const docs = await col.find({}, {
    projection: {
      fileName: 1, subject: 1, fileType: 1, contentLength: 1,
      wordCount: 1, totalChunks: 1, chapters: 1, chapterTitles: 1,
      uploadedAt: 1, updatedAt: 1
    }
  }).sort({ uploadedAt: -1 }).toArray();

  return {
    success: true,
    count: docs.length,
    documents: docs.map(d => ({
      _id: d._id.toString(),
      fileName: d.fileName,
      subject: d.subject,
      fileType: d.fileType,
      contentLength: d.contentLength,
      wordCount: d.wordCount || 0,
      totalChunks: d.totalChunks,
      chapters: d.chapters || [],
      chapterTitles: d.chapterTitles || (d.chapters || []).map(c => c.title),
      uploadedAt: d.uploadedAt
    }))
  };
}

/**
 * Simple text similarity search
 */
async function searchDocuments(query, topK = 5, minSimilarity = 0.2) {
  const col = getCollection();
  const docs = await col.find({}).toArray();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

  const results = [];
  for (const doc of docs) {
    for (let i = 0; i < doc.chunks.length; i++) {
      const chunk = doc.chunks[i];
      const chunkLower = chunk.toLowerCase();

      // Simple TF-based similarity
      let matchCount = 0;
      for (const term of queryTerms) {
        if (chunkLower.includes(term)) matchCount++;
      }
      const similarity = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;

      if (similarity >= minSimilarity) {
        // Find which chapter this chunk belongs to
        let chapterTitle = 'General';
        if (doc.chapters && doc.chapters.length > 0) {
          const charPos = doc.content ? doc.content.indexOf(chunk.substring(0, 50)) : -1;
          for (let c = doc.chapters.length - 1; c >= 0; c--) {
            if (charPos >= doc.chapters[c].position) {
              chapterTitle = doc.chapters[c].title;
              break;
            }
          }
        }
        results.push({
          docId: doc._id.toString(),
          fileName: doc.fileName,
          subject: doc.subject,
          chapterTitle,
          chunkIndex: i,
          content: chunk,
          relevantChunk: { text: chunk },
          score: Math.round(similarity * 100) / 100,
          similarity: Math.round(similarity * 100) / 100
        });
      }
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return {
    success: true,
    query,
    results: results.slice(0, topK),
    totalMatches: results.length
  };
}

/**
 * Delete a document by ID
 */
async function deleteDocument(docId) {
  const col = getCollection();
  const result = await col.deleteOne({ _id: new ObjectId(docId) });
  return {
    success: result.deletedCount > 0,
    deletedCount: result.deletedCount
  };
}

/**
 * Clear entire library
 */
async function clearLibrary() {
  const col = getCollection();
  const result = await col.deleteMany({});
  return {
    success: true,
    deletedCount: result.deletedCount
  };
}

/**
 * Validate a response (basic quality check)
 */
function validateResponse(responseText, threshold = 0.6) {
  const words = responseText.trim().split(/\s+/);
  const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const hasContent = words.length > 5;
  const hasSentences = sentences.length >= 1;
  const notTooShort = responseText.length > 20;
  const score = (hasContent ? 0.4 : 0) + (hasSentences ? 0.3 : 0) + (notTooShort ? 0.3 : 0);
  const isValid = score >= threshold;

  let reason = isValid ? 'Response meets quality standards.' : 'Response needs improvement.';
  if (!hasContent) reason = 'Response is too short or lacks meaningful content.';
  else if (!hasSentences) reason = 'Response lacks proper sentence structure.';
  else if (!notTooShort) reason = 'Response is too brief for a quality answer.';

  return {
    success: true,
    validation: {
      isValid,
      score: Math.round(score * 100) / 100,
      wordCount: words.length,
      sentences: sentences.length,
      reason
    }
  };
}

module.exports = {
  uploadDocument,
  getLibrary,
  searchDocuments,
  deleteDocument,
  clearLibrary,
  validateResponse
};
