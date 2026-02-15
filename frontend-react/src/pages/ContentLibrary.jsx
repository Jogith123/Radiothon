/**
 * Content Library Page
 * Full-page interface for managing RAG knowledge base documents
 * Uses Tailwind CSS for proper dark mode support
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Search,
  Trash2,
  FileText,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import { PageHeader, Button, Card } from '../components/common';
import {
  uploadDocument,
  getContentLibrary,
  searchLibrary,
  deleteDocument,
  clearLibrary,
  validateResponse,
  generateRAGAnswer
} from '../api/ragClient';

// Motion presets
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const tabs = [
  { key: 'library', label: 'Library', icon: BookOpen },
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'search', label: 'Search', icon: Search },
  { key: 'validate', label: 'Validate', icon: CheckSquare },
  { key: 'generate', label: 'Generate', icon: Database },
];

const ContentLibrary = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    totalSize: 0,
    subjects: []
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSubject, setUploadSubject] = useState('Documentation');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState(null);

  const [validationText, setValidationText] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibrary();
    }
  }, [activeTab]);

  async function fetchLibrary() {
    setLoading(true);
    setError(null);
    try {
      const data = await getContentLibrary();
      const docs = data.documents || [];
      setDocuments(docs);

      const totalChunks = docs.reduce((sum, doc) => sum + (doc.totalChunks || 0), 0);
      const totalSize = docs.reduce((sum, doc) => sum + (doc.contentLength || 0), 0);
      const subjects = [...new Set(docs.map(doc => doc.subject))];
      const totalChapters = docs.reduce((sum, doc) => sum + (doc.chapters?.length || 0), 0);

      setStats({
        totalDocuments: data.count || 0,
        totalChunks,
        totalChapters,
        totalSize: (totalSize / 1024 / 1024).toFixed(2),
        subjects
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) { setError('Please select a file'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      setUploadProgress(25);
      const result = await uploadDocument(selectedFile, uploadSubject);
      setUploadProgress(75);
      if (result.success) {
        const chapterInfo = result.chaptersDetected ? ` (${result.chaptersDetected} chapters, ${result.chunksCreated} chunks)` : '';
        setSuccess(`Uploaded: ${selectedFile.name}${chapterInfo}`);
        setSelectedFile(null);
        setUploadSubject('Documentation');
        setUploadProgress(100);
        setTimeout(() => { setUploadProgress(0); setActiveTab('library'); }, 1500);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) { setError('Please enter a search query'); return; }
    setSearching(true); setError(null);
    try {
      const results = await searchLibrary(searchQuery, 5, 0.1);
      setSearchResults(results.results || []);
    } catch (err) { setError(err.message); } finally { setSearching(false); }
  }

  async function handleDelete(docId) {
    if (window.confirm('Delete this document?')) {
      setLoading(true);
      try { await deleteDocument(docId); setSuccess('Document deleted'); await fetchLibrary(); }
      catch (err) { setError(err.message); } finally { setLoading(false); }
    }
  }

  async function handleClearLibrary() {
    if (window.confirm('Delete ALL documents? This cannot be undone.')) {
      setLoading(true);
      try { await clearLibrary(); setSuccess('Library cleared'); await fetchLibrary(); }
      catch (err) { setError(err.message); } finally { setLoading(false); }
    }
  }

  async function handleValidate() {
    if (!validationText.trim()) { setError('Please enter a response to validate'); return; }
    setLoading(true);
    try { const result = await validateResponse(validationText); setValidationResult(result); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleGenerateRag() {
    if (!ragQuery.trim()) { setError('Please enter a query'); return; }
    setLoading(true);
    try { const result = await generateRAGAnswer(ragQuery); setRagResult(result); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-[1400px] mx-auto"
    >
      <PageHeader
        title="Content Library"
        description="Manage your RAG knowledge base documents"
      />

      {/* Alert Messages */}
      {error && (
        <motion.div variants={itemVariants} className="mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle size={18} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xl opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer">&times;</button>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div variants={itemVariants} className="mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle size={18} />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-xl opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer">&times;</button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-700 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setError(null); setSuccess(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-all border-b-2 -mb-[3px] bg-transparent cursor-pointer ${
                activeTab === tab.key
                  ? 'text-primary dark:text-primary-light border-primary dark:border-primary-light'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                <Loader2 size={32} className="animate-spin mx-auto mb-3" />
                <p>Loading library...</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: '📄', value: stats.totalDocuments, label: 'Documents' },
                    { icon: '📖', value: stats.totalChapters || 0, label: 'Chapters' },
                    { icon: '🔗', value: stats.totalChunks, label: 'Chunks' },
                    { icon: '🏷️', value: stats.subjects.length, label: 'Subjects' },
                  ].map(stat => (
                    <div key={stat.label} className="glass p-5 rounded-xl text-center">
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-primary dark:text-primary-light">{stat.value}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Documents List */}
                {documents.length > 0 ? (
                  <>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Documents ({documents.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                      {documents.map(doc => (
                        <div key={doc._id} className="glass rounded-xl p-4 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex gap-3 items-start flex-1 min-w-0">
                              <FileText size={20} className="text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{doc.fileName}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{doc.subject} &bull; {doc.wordCount?.toLocaleString() || '?'} words</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[11px] font-semibold uppercase shrink-0">
                              {doc.fileType}
                            </span>
                          </div>

                          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <span>📑 {doc.chapters?.length || 0} chapters</span>
                            <span>🔗 {doc.totalChunks || 0} chunks</span>
                            <span>📅 {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>

                          {doc.chapterTitles && doc.chapterTitles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center mb-3">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Chapters:</span>
                              {doc.chapterTitles.slice(0, 5).map((title, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded text-[11px] font-medium max-w-[200px] truncate">
                                  {title}
                                </span>
                              ))}
                              {doc.chapterTitles.length > 5 && (
                                <span className="text-[11px] text-slate-500 italic">+{doc.chapterTitles.length - 5} more</span>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleDelete(doc._id)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 border-none cursor-pointer"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleClearLibrary}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      <Trash2 size={16} /> Clear All Documents
                    </button>
                  </>
                ) : (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <Database size={48} className="mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">No documents yet</h3>
                    <p className="text-sm">Upload your first document to get started</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold mb-5 text-slate-800 dark:text-white">Upload Document</h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select File (PDF, DOCX, TXT)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={loading}
                  />
                  <div className="px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer hover:border-primary dark:hover:border-primary-light transition-colors">
                    {selectedFile ? `✅ ${selectedFile.name}` : '📁 Choose file...'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subject/Category</label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={e => setUploadSubject(e.target.value)}
                  placeholder="e.g., FAQ, Documentation, Guide"
                  className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  disabled={loading}
                />
              </div>

              {uploadProgress > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-[40px]">{uploadProgress}%</span>
                </div>
              )}

              <Button onClick={handleUpload} disabled={loading || !selectedFile} variant="primary">
                <Upload size={16} /> {loading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold mb-5 text-slate-800 dark:text-white">Search Content Library</h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Search Query</label>
                <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter search query..."
                    className="flex-1 border-none bg-transparent text-sm outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    disabled={searching}
                  />
                </div>
              </div>

              <Button onClick={handleSearch} disabled={searching || !searchQuery} variant="primary">
                <Search size={16} /> {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <>
                <h4 className="text-base font-semibold mt-6 mb-4 text-slate-800 dark:text-white">Results ({searchResults.length})</h4>
                <div className="flex flex-col gap-3">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="glass p-4 rounded-lg border-l-4 border-l-primary">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{result.fileName}</h4>
                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-semibold">
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        📑 {result.chapterTitle || 'Unknown'} &bull; {result.subject}
                      </p>
                      {result.relevantChunk && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                          &quot;{result.relevantChunk.text.substring(0, 200)}...&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Validate Tab */}
        {activeTab === 'validate' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold mb-5 text-slate-800 dark:text-white">Validate Response Quality</h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Response Text</label>
                <textarea
                  value={validationText}
                  onChange={e => setValidationText(e.target.value)}
                  placeholder="Enter response to validate..."
                  className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-[120px] resize-y outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  disabled={loading}
                />
              </div>

              <Button onClick={handleValidate} disabled={loading || !validationText} variant="primary">
                <CheckSquare size={16} /> Validate
              </Button>
            </div>

            {validationResult && (
              <div className="glass p-4 rounded-lg border-l-4 border-l-primary mt-6">
                <h4 className="text-base font-semibold mb-4 text-slate-800 dark:text-white">Validation Result</h4>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Status', value: validationResult.validation.isValid ? '✅ Valid' : '❌ Invalid', color: validationResult.validation.isValid ? 'text-green-500' : 'text-red-500' },
                    { label: 'Quality Score', value: `${(validationResult.validation.score * 100).toFixed(0)}%` },
                    { label: 'Word Count', value: validationResult.validation.wordCount },
                    { label: 'Sentences', value: validationResult.validation.sentences },
                    { label: 'Message', value: validationResult.validation.reason },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 text-sm border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                      <span className={`font-semibold ${row.color || 'text-primary dark:text-primary-light'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate RAG Tab */}
        {activeTab === 'generate' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">Test RAG Retrieval</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Enter a question to see which chapters and chunks the RAG system retrieves from your knowledge base.
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">User Query</label>
                <input
                  type="text"
                  value={ragQuery}
                  onChange={e => setRagQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateRag()}
                  placeholder="Ask a question about your uploaded documents..."
                  className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  disabled={loading}
                />
              </div>

              <Button onClick={handleGenerateRag} disabled={loading || !ragQuery} variant="primary">
                {loading ? 'Searching...' : 'Find Relevant Context'}
              </Button>
            </div>

            {ragResult && (
              <>
                {ragResult.sources && ragResult.sources.length > 0 && (
                  <div className="glass p-4 rounded-lg border-l-4 border-l-primary mt-6">
                    <h4 className="text-base font-semibold mb-4 text-slate-800 dark:text-white">Sources Found ({ragResult.sourcesCount})</h4>
                    <div className="flex flex-col gap-2">
                      {ragResult.sources.map((source, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <FileText size={16} className="text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{source.chapterTitle || source.fileName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{source.fileName} &bull; {source.subject}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[11px] font-semibold shrink-0">
                            {Math.round(source.relevanceScore * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ragResult.augmentedContext && (
                  <div className="glass p-4 rounded-lg border-l-4 border-l-primary mt-4">
                    <h4 className="text-base font-semibold mb-3 text-slate-800 dark:text-white">Retrieved Context</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                      {ragResult.augmentedContext}
                    </p>
                  </div>
                )}

                {ragResult.sourcesCount === 0 && (
                  <div className="glass p-6 rounded-lg mt-6 text-center">
                    <p className="text-slate-400 dark:text-slate-500">
                      No relevant content found. Try uploading more documents or using different keywords.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </motion.div>
    </motion.div>
  );
};

export default ContentLibrary;
