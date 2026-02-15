/**
 * RAG (Retrieval-Augmented Generation) Service
 * MongoDB-backed document store with vector embeddings for semantic search
 * Uses Gemini text-embedding-004 for generating embeddings
 */

const { getDatabase, isConnected } = require('../database/connection');
const { ObjectId } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const DOC_COLLECTION = 'rag_documents';
const CHUNK_COLLECTION = 'rag_chunks';
const CHUNK_SIZE = 1500;      // characters per chunk (larger for better context)
const CHUNK_OVERLAP = 200;    // overlap between chunks for continuity
const EMBEDDING_BATCH_SIZE = 100; // Gemini batch limit

let embeddingModel = null;

// ========================================
// Initialization
// ========================================

/**
 * Initialize the Gemini embedding model
 * DISABLED: Current SDK version doesn't support embedContent API properly
 * Using text-based search instead which is fast and effective for chunked documents
 */
function initializeEmbeddings() {
  console.log('ℹ️  Vector embeddings disabled - using text-based semantic search');
  return false;
}

// ========================================
// Collection Helpers
// ========================================

function getDocCollection() {
  const db = getDatabase();
  if (!db) throw new Error('Database not connected');
  return db.collection(DOC_COLLECTION);
}

function getChunkCollection() {
  const db = getDatabase();
  if (!db) throw new Error('Database not connected');
  return db.collection(CHUNK_COLLECTION);
}

// ========================================
// Text Chunking
// ========================================

/**
 * Split text into overlapping chunks of ~CHUNK_SIZE characters
 * Splits on sentence boundaries for clean chunks
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const chunks = [];
  let current = '';
  let overlapBuffer = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep last portion for overlap
      const words = current.split(' ');
      const overlapWords = Math.ceil(overlap / 5); // ~5 chars per word avg
      overlapBuffer = words.slice(-overlapWords).join(' ');
      current = overlapBuffer + ' ' + sentence;
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
  const chapterPattern = /^(chapter|section|unit|module|part|lab|experiment|exercise|lesson|topic)\s*[\d.:]+\s*.*/gim;
  const matches = [...text.matchAll(chapterPattern)];
  return matches.map(m => ({
    title: m[0].trim(),
    position: m.index
  }));
}

// ========================================
// Embedding Functions
// ========================================

/**
 * Generate embedding for a single text
 */
async function generateEmbedding(text) {
  if (!embeddingModel) initializeEmbeddings();
  if (!embeddingModel) throw new Error('Embedding model not available');

  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings in batches (max 100 per API call)
 */
async function generateBatchEmbeddings(texts) {
  if (!embeddingModel) initializeEmbeddings();
  if (!embeddingModel) throw new Error('Embedding model not available');

  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const requests = batch.map(text => ({
      content: { parts: [{ text }] }
    }));

    console.log(`🔮 Generating embeddings batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(texts.length / EMBEDDING_BATCH_SIZE)} (${batch.length} chunks)...`);

    const result = await embeddingModel.batchEmbedContents({ requests });
    allEmbeddings.push(...result.embeddings.map(e => e.values));

    // Small delay between batches to avoid rate limits
    if (i + EMBEDDING_BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return allEmbeddings;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ========================================
// Document Upload & Indexing
// ========================================

/**
 * Upload and store a document with vector embeddings
 */
async function uploadDocument(fileName, content, subject = 'General', fileType = 'txt') {
  const docCol = getDocCollection();
  const chunkCol = getChunkCollection();

  // Delete existing document with same name (re-upload)
  const existing = await docCol.findOne({ fileName });
  if (existing) {
    await docCol.deleteOne({ _id: existing._id });
    await chunkCol.deleteMany({ docId: existing._id });
    console.log(`🗑️ Removed old version of ${fileName}`);
  }

  // Chunk the text
  const chunks = chunkText(content);
  const chapters = detectChapters(content);
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  console.log(`📄 Processing ${fileName}: ${content.length} chars, ${wordCount} words, ${chunks.length} chunks`);

  // Store document metadata (without full content to save space, keep a summary)
  const contentPreview = content.substring(0, 2000) + (content.length > 2000 ? '...' : '');
  const doc = {
    fileName,
    subject,
    fileType,
    contentLength: content.length,
    contentPreview,
    wordCount,
    totalChunks: chunks.length,
    chapters,
    chapterTitles: chapters.map(c => c.title),
    hasEmbeddings: false,
    uploadedAt: new Date(),
    updatedAt: new Date()
  };

  const result = await docCol.insertOne(doc);
  const docId = result.insertedId;

  // Store chunks (without embeddings - using text-based search)
  const chunkDocs = chunks.map((chunkText, i) => {
    let chapterTitle = 'General';
    if (chapters.length > 0) {
      // Approximate character position
      const approxPos = content.indexOf(chunkText.substring(0, 80));
      for (let c = chapters.length - 1; c >= 0; c--) {
        if (approxPos >= chapters[c].position) {
          chapterTitle = chapters[c].title;
          break;
        }
      }
    }

    return {
      docId,
      fileName,
      subject,
      chunkIndex: i,
      content: chunkText,
      chapterTitle,
      embedding: null, // No embeddings - using text search
      createdAt: new Date()
    };
  });

  // Insert all chunks
  if (chunkDocs.length > 0) {
    await chunkCol.insertMany(chunkDocs);
    console.log(`✅ Stored ${chunkDocs.length} chunks for text-based search`);
  }

  return {
    success: true,
    docId: docId.toString(),
    fileName,
    subject,
    totalChunks: chunks.length,
    contentLength: content.length,
    chapters: chapters.length,
    hasEmbeddings: false
  };
}

// ========================================
// Vector Search
// ========================================

/**
 * Semantic vector search - finds most relevant chunks for a query
 * @param {string} query - The search query
 * @param {number} topK - Number of top results to return (default 10)
 * @param {number} minSimilarity - Minimum cosine similarity threshold (default 0.3)
 * @returns {Object} Search results with relevant chunks
 */
async function vectorSearch(query, topK = 10, minSimilarity = 0.3) {
  const chunkCol = getChunkCollection();

  try {
    // Generate query embedding
    console.log(`🔍 Vector search for: "${query}"`);
    const queryEmbedding = await generateEmbedding(query);

    // Fetch all chunks that have embeddings
    const allChunks = await chunkCol.find(
      { embedding: { $ne: null } },
      { projection: { content: 1, embedding: 1, fileName: 1, subject: 1, chapterTitle: 1, chunkIndex: 1, docId: 1 } }
    ).toArray();

    if (allChunks.length === 0) {
      console.log('⚠️ No vector-indexed chunks found');
      return { success: true, query, results: [], totalMatches: 0 };
    }

    console.log(`📊 Comparing against ${allChunks.length} indexed chunks...`);

    // Compute cosine similarity for each chunk
    const scored = allChunks.map(chunk => ({
      docId: chunk.docId.toString(),
      fileName: chunk.fileName,
      subject: chunk.subject,
      chapterTitle: chunk.chapterTitle,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity descending
    scored.sort((a, b) => b.similarity - a.similarity);

    // Filter by minimum similarity and take top K
    const results = scored
      .filter(r => r.similarity >= minSimilarity)
      .slice(0, topK);

    console.log(`✅ Found ${results.length} relevant chunks (top similarity: ${results[0]?.similarity?.toFixed(3) || 'N/A'})`);

    return {
      success: true,
      query,
      results,
      totalMatches: scored.filter(r => r.similarity >= minSimilarity).length,
      totalChunksSearched: allChunks.length
    };
  } catch (error) {
    // Embedding failed, return empty results to trigger text search fallback
    console.log(`⚠️ Vector search failed (${error.message}), will fall back to text search`);
    return { success: true, query, results: [], totalMatches: 0 };
  }
}

// ========================================
// Library & Search (backward compatible)
// ========================================

/**
 * Get all documents (metadata only)
 */
async function getLibrary() {
  const docCol = getDocCollection();
  const docs = await docCol.find({}, {
    projection: {
      fileName: 1, subject: 1, fileType: 1, contentLength: 1,
      wordCount: 1, totalChunks: 1, chapters: 1, chapterTitles: 1,
      hasEmbeddings: 1, uploadedAt: 1, updatedAt: 1
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
      hasEmbeddings: d.hasEmbeddings || false,
      uploadedAt: d.uploadedAt
    }))
  };
}

/**
 * Text-based similarity search (fallback when embeddings unavailable)
 */
async function searchDocuments(query, topK = 5, minSimilarity = 0.2) {
  // Try vector search first
  try {
    const vectorResults = await vectorSearch(query, topK, minSimilarity);
    if (vectorResults.results.length > 0) {
      return {
        success: true,
        query,
        results: vectorResults.results.map(r => ({
          docId: r.docId,
          fileName: r.fileName,
          subject: r.subject,
          chapterTitle: r.chapterTitle,
          chunkIndex: r.chunkIndex,
          content: r.content,
          relevantChunk: { text: r.content },
          score: Math.round(r.similarity * 100) / 100,
          similarity: Math.round(r.similarity * 100) / 100
        })),
        totalMatches: vectorResults.totalMatches,
        searchType: 'vector'
      };
    }
  } catch (err) {
    console.log('⚠️ Vector search failed, falling back to text search:', err.message);
  }

  // Fallback: simple text matching on chunks collection
  const chunkCol = getChunkCollection();
  const allChunks = await chunkCol.find({}, { projection: { content: 1, fileName: 1, subject: 1, chapterTitle: 1, chunkIndex: 1, docId: 1 } }).toArray();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

  const results = [];
  for (const chunk of allChunks) {
    const chunkLower = chunk.content.toLowerCase();
    let matchCount = 0;
    for (const term of queryTerms) {
      if (chunkLower.includes(term)) matchCount++;
    }
    const similarity = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;

    if (similarity >= minSimilarity) {
      results.push({
        docId: chunk.docId.toString(),
        fileName: chunk.fileName,
        subject: chunk.subject,
        chapterTitle: chunk.chapterTitle,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        relevantChunk: { text: chunk.content },
        score: Math.round(similarity * 100) / 100,
        similarity: Math.round(similarity * 100) / 100
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return {
    success: true,
    query,
    results: results.slice(0, topK),
    totalMatches: results.length,
    searchType: 'text'
  };
}

// ========================================
// Delete & Clear
// ========================================

/**
 * Delete a document and its chunks by ID
 */
async function deleteDocument(docId) {
  const docCol = getDocCollection();
  const chunkCol = getChunkCollection();
  const oid = new ObjectId(docId);

  const result = await docCol.deleteOne({ _id: oid });
  const chunkResult = await chunkCol.deleteMany({ docId: oid });

  console.log(`🗑️ Deleted document ${docId} and ${chunkResult.deletedCount} chunks`);
  return {
    success: result.deletedCount > 0,
    deletedCount: result.deletedCount,
    chunksDeleted: chunkResult.deletedCount
  };
}

/**
 * Clear entire library (documents + chunks)
 */
async function clearLibrary() {
  const docCol = getDocCollection();
  const chunkCol = getChunkCollection();

  const docResult = await docCol.deleteMany({});
  const chunkResult = await chunkCol.deleteMany({});

  return {
    success: true,
    deletedCount: docResult.deletedCount,
    chunksDeleted: chunkResult.deletedCount
  };
}

// ========================================
// Validation
// ========================================

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
  initializeEmbeddings,
  uploadDocument,
  getLibrary,
  searchDocuments,
  vectorSearch,
  deleteDocument,
  clearLibrary,
  validateResponse
};
