// RAG Integration Service for Frontend
// Place this in: frontend-react/src/api/ragClient.js

/**
 * RAG (Retrieval-Augmented Generation) API Client
 * Handles all communication with the backend RAG system
 */

const RAG_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || ''}/api/rag`;

/**
 * Upload a document to the RAG library
 * @param {File} file - The document file (PDF, DOCX, or TXT)
 * @param {string} subject - Subject category for the document
 * @returns {Promise<Object>} Upload result with docId and metadata
 */
export async function uploadDocument(file, subject = 'General') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);

    const response = await fetch(`${RAG_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Get all documents in the content library
 * @returns {Promise<Object>} Library data with documents array
 */
export async function getContentLibrary() {
  try {
    const response = await fetch(`${RAG_BASE_URL}/library`);

    if (!response.ok) {
      throw new Error(`Failed to get library: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting content library:', error);
    throw error;
  }
}

/**
 * Search the content library
 * @param {string} query - Search query
 * @param {number} topK - Maximum number of results (default: 5)
 * @param {number} minSimilarity - Minimum similarity score (default: 0.2)
 * @returns {Promise<Object>} Search results
 */
export async function searchLibrary(query, topK = 5, minSimilarity = 0.2) {
  try {
    const response = await fetch(`${RAG_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK, minSimilarity })
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching library:', error);
    throw error;
  }
}

/**
 * Delete a document from the library
 * @param {string} docId - Document ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteDocument(docId) {
  try {
    const response = await fetch(`${RAG_BASE_URL}/content/${docId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Clear the entire content library
 * @returns {Promise<Object>} Clear operation result
 */
export async function clearLibrary() {
  try {
    const response = await fetch(`${RAG_BASE_URL}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Clear failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing library:', error);
    throw error;
  }
}

/**
 * Validate the quality of a response
 * @param {string} response - Response text to validate
 * @param {number} threshold - Quality threshold (default: 0.6)
 * @returns {Promise<Object>} Validation result
 */
export async function validateResponse(response, threshold = 0.6) {
  try {
    const res = await fetch(`${RAG_BASE_URL}/validate-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, threshold })
    });

    if (!res.ok) {
      throw new Error(`Validation failed: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error validating response:', error);
    throw error;
  }
}

/**
 * Generate a RAG-enhanced answer
 * @param {string} query - Original user query
 * @returns {Promise<Object>} RAG-enhanced answer with sources
 */
export async function generateRAGAnswer(query) {
  try {
    const response = await fetch(`${RAG_BASE_URL}/generate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`RAG generation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating RAG answer:', error);
    throw error;
  }
}

/**
 * Batch import multiple documents
 * @param {File[]} files - Array of files to upload
 * @param {string} subject - Subject category for all files
 * @returns {Promise<Object[]>} Array of upload results
 */
export async function batchUploadDocuments(files, subject = 'General') {
  try {
    const results = await Promise.all(
      files.map(file => uploadDocument(file, subject))
    );
    return results;
  } catch (error) {
    console.error('Error in batch upload:', error);
    throw error;
  }
}

/**
 * Get library statistics
 * @returns {Promise<Object>} Library statistics
 */
export async function getLibraryStats() {
  try {
    const library = await getContentLibrary();
    const docs = library.documents || [];
    const stats = {
      totalDocuments: library.count,
      totalChunks: docs.reduce((sum, doc) => sum + (doc.totalChunks || 0), 0),
      subjects: [...new Set(docs.map(doc => doc.subject))],
      fileTypes: [...new Set(docs.map(doc => doc.fileType))],
      totalSize: docs.reduce((sum, doc) => sum + (doc.contentLength || 0), 0),
      documents: docs.map(doc => ({
        id: doc._id,
        name: doc.fileName,
        subject: doc.subject,
        chunks: doc.totalChunks || 0,
        uploadedAt: doc.uploadedAt
      }))
    };
    return stats;
  } catch (error) {
    console.error('Error getting library stats:', error);
    throw error;
  }
}

export default {
  uploadDocument,
  getContentLibrary,
  searchLibrary,
  deleteDocument,
  clearLibrary,
  validateResponse,
  generateRAGAnswer,
  batchUploadDocuments,
  getLibraryStats
};
