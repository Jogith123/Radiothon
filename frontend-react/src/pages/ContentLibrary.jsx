/**
 * Content Library Page
 * Full-page interface for managing RAG knowledge base documents
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
  Loader,
  BookOpen,
  CheckSquare,
  Download
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

const ContentLibrary = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('library');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Library State
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    totalSize: 0,
    subjects: []
  });

  // Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSubject, setUploadSubject] = useState('Documentation');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // RAG Answer State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState(null);

  // Validation State
  const [validationText, setValidationText] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // Load library on mount and tab change
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

      // Calculate stats from new chapter-aware structure
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
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

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
        setTimeout(() => {
          setUploadProgress(0);
          setActiveTab('library');
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const results = await searchLibrary(searchQuery, 5, 0.1);
      setSearchResults(results.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleDelete(docId) {
    if (window.confirm('Delete this document?')) {
      setLoading(true);
      try {
        await deleteDocument(docId);
        setSuccess('Document deleted');
        await fetchLibrary();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleClearLibrary() {
    if (window.confirm('Delete ALL documents? This cannot be undone.')) {
      setLoading(true);
      try {
        await clearLibrary();
        setSuccess('Library cleared');
        await fetchLibrary();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleValidate() {
    if (!validationText.trim()) {
      setError('Please enter a response to validate');
      return;
    }

    setLoading(true);
    try {
      const result = await validateResponse(validationText);
      setValidationResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateRag() {
    if (!ragQuery.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const result = await generateRAGAnswer(ragQuery);
      setRagResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="content-library"
      style={styles.container}
    >
      <PageHeader
        title="📚 Content Library"
        subtitle="Manage your RAG knowledge base documents"
        icon={<BookOpen size={28} />}
      />

      {/* Alert Messages */}
      {error && (
        <motion.div variants={itemVariants} style={styles.alert}>
          <div style={{ ...styles.alertInner, ...styles.alertError }}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.closeBtn}>×</button>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div variants={itemVariants} style={styles.alert}>
          <div style={{ ...styles.alertInner, ...styles.alertSuccess }}>
            <CheckCircle size={18} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={styles.closeBtn}>×</button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={itemVariants} style={styles.tabsContainer}>
        {[
          { key: 'library', label: '📖 Library', icon: '📚' },
          { key: 'upload', label: '📤 Upload', icon: '⬆️' },
          { key: 'search', label: '🔍 Search', icon: '🔎' },
          { key: 'validate', label: '✔️ Validate', icon: '✅' },
          { key: 'generate', label: '🧠 Generate', icon: '🤖' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setError(null);
              setSuccess(null);
            }}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {})
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div style={styles.tabContent}>
            {loading ? (
              <div style={styles.centerLoader}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <p>Loading library...</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div style={styles.statsGrid}>
                  <Card style={styles.statCard}>
                    <div style={styles.statIcon}>📄</div>
                    <div style={styles.statValue}>{stats.totalDocuments}</div>
                    <div style={styles.statLabel}>Documents</div>
                  </Card>
                  <Card style={styles.statCard}>
                    <div style={styles.statIcon}>�</div>
                    <div style={styles.statValue}>{stats.totalChapters || 0}</div>
                    <div style={styles.statLabel}>Chapters</div>
                  </Card>
                  <Card style={styles.statCard}>
                    <div style={styles.statIcon}>🔗</div>
                    <div style={styles.statValue}>{stats.totalChunks}</div>
                    <div style={styles.statLabel}>Chunks</div>
                  </Card>
                  <Card style={styles.statCard}>
                    <div style={styles.statIcon}>🏷️</div>
                    <div style={styles.statValue}>{stats.subjects.length}</div>
                    <div style={styles.statLabel}>Subjects</div>
                  </Card>
                </div>

                {/* Documents List */}
                {documents.length > 0 ? (
                  <>
                    <h3 style={styles.sectionTitle}>Documents ({documents.length})</h3>
                    <div style={styles.documentsList}>
                      {documents.map(doc => (
                        <Card key={doc._id} style={styles.docCard}>
                          <div style={styles.docHeader}>
                            <div style={styles.docInfo}>
                              <FileText size={20} style={{ color: '#0066cc' }} />
                              <div>
                                <h4 style={styles.docName}>{doc.fileName}</h4>
                                <p style={styles.docMeta}>{doc.subject} &bull; {doc.wordCount?.toLocaleString() || '?'} words</p>
                              </div>
                            </div>
                            <span style={styles.badge}>{doc.fileType}</span>
                          </div>
                          <div style={styles.docStats}>
                            <span>📑 {doc.chapters?.length || 0} chapters</span>
                            <span>🔗 {doc.totalChunks || 0} chunks</span>
                            <span>📅 {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                          {/* Show chapter titles */}
                          {doc.chapterTitles && doc.chapterTitles.length > 0 && (
                            <div style={styles.chapterList}>
                              <span style={styles.chapterLabel}>Chapters:</span>
                              {doc.chapterTitles.slice(0, 5).map((title, i) => (
                                <span key={i} style={styles.chapterTag}>{title}</span>
                              ))}
                              {doc.chapterTitles.length > 5 && (
                                <span style={styles.chapterMore}>+{doc.chapterTitles.length - 5} more</span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(doc._id)}
                            style={styles.deleteBtn}
                            disabled={loading}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </Card>
                      ))}
                    </div>

                    <Button
                      onClick={handleClearLibrary}
                      disabled={loading}
                      style={styles.dangerBtn}
                    >
                      <Trash2 size={18} /> Clear All Documents
                    </Button>
                  </>
                ) : (
                  <div style={styles.emptyState}>
                    <Database size={48} />
                    <h3>No documents yet</h3>
                    <p>Upload your first document to get started</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <Card style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>Upload Document</h3>

            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select File (PDF, DOCX, TXT)</label>
                <div style={styles.fileInputWrapper}>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                    disabled={loading}
                  />
                  <span style={styles.fileInputLabel}>
                    {selectedFile ? `✅ ${selectedFile.name}` : '📁 Choose file...'}
                  </span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject/Category</label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={e => setUploadSubject(e.target.value)}
                  placeholder="e.g., FAQ, Documentation, Guide"
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              {uploadProgress > 0 && (
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
                  </div>
                  <span style={styles.progressText}>{uploadProgress}%</span>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                style={styles.primaryBtn}
              >
                <Upload size={18} /> {loading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </Card>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <Card style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>Search Content Library</h3>

            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Search Query</label>
                <div style={styles.searchInputWrapper}>
                  <Search size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter search query..."
                    style={styles.searchInput}
                    disabled={searching}
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={searching || !searchQuery}
                style={styles.primaryBtn}
              >
                <Search size={18} /> {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <>
                <h4 style={styles.resultsTitle}>Results ({searchResults.length})</h4>
                <div style={styles.resultsList}>
                  {searchResults.map((result, idx) => (
                    <Card key={idx} style={styles.resultCard}>
                      <div style={styles.resultHeader}>
                        <h4 style={styles.resultName}>{result.fileName}</h4>
                        <div style={styles.relevanceScore}>
                          {Math.round(result.score * 100)}%
                        </div>
                      </div>
                      <p style={styles.resultSubject}>
                        📑 {result.chapterTitle || 'Unknown'} &bull; {result.subject}
                      </p>
                      {result.relevantChunk && (
                        <p style={styles.resultSnippet}>
                          &quot;{result.relevantChunk.text.substring(0, 200)}...&quot;
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}

        {/* Validate Tab */}
        {activeTab === 'validate' && (
          <Card style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>Validate Response Quality</h3>

            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Response Text</label>
                <textarea
                  value={validationText}
                  onChange={e => setValidationText(e.target.value)}
                  placeholder="Enter response to validate..."
                  style={styles.textarea}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleValidate}
                disabled={loading || !validationText}
                style={styles.primaryBtn}
              >
                <CheckSquare size={18} /> Validate
              </Button>
            </div>

            {validationResult && (
              <Card style={styles.resultCard}>
                <h4 style={styles.resultTitle}>Validation Result</h4>
                <div style={styles.validationDetails}>
                  <div style={styles.validationRow}>
                    <span>Status:</span>
                    <span style={{
                      ...styles.validationValue,
                      color: validationResult.validation.isValid ? '#22c55e' : '#ef4444'
                    }}>
                      {validationResult.validation.isValid ? '✅ Valid' : '❌ Invalid'}
                    </span>
                  </div>
                  <div style={styles.validationRow}>
                    <span>Quality Score:</span>
                    <span style={styles.validationValue}>
                      {(validationResult.validation.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={styles.validationRow}>
                    <span>Word Count:</span>
                    <span style={styles.validationValue}>
                      {validationResult.validation.wordCount}
                    </span>
                  </div>
                  <div style={styles.validationRow}>
                    <span>Sentences:</span>
                    <span style={styles.validationValue}>
                      {validationResult.validation.sentences}
                    </span>
                  </div>
                  <div style={styles.validationRow}>
                    <span>Message:</span>
                    <span style={styles.validationValue}>
                      {validationResult.validation.reason}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </Card>
        )}

        {/* Generate RAG Tab */}
        {activeTab === 'generate' && (
          <Card style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>Test RAG Retrieval</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Enter a question to see which chapters and chunks the RAG system retrieves from your knowledge base.
            </p>

            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>User Query</label>
                <input
                  type="text"
                  value={ragQuery}
                  onChange={e => setRagQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleGenerateRag()}
                  placeholder="Ask a question about your uploaded documents..."
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleGenerateRag}
                disabled={loading || !ragQuery}
                style={styles.primaryBtn}
              >
                {loading ? 'Searching...' : '🔍 Find Relevant Context'}
              </Button>
            </div>

            {ragResult && (
              <>
                {ragResult.sources && ragResult.sources.length > 0 && (
                  <Card style={{ ...styles.resultCard, marginTop: '24px' }}>
                    <h4 style={styles.resultTitle}>📑 Sources Found ({ragResult.sourcesCount})</h4>
                    <div style={styles.sourcesList}>
                      {ragResult.sources.map((source, idx) => (
                        <div key={idx} style={styles.sourceItem}>
                          <FileText size={16} />
                          <div>
                            <p style={styles.sourceName}>{source.chapterTitle || source.fileName}</p>
                            <p style={styles.sourceSubject}>{source.fileName} &bull; {source.subject}</p>
                          </div>
                          <span style={styles.sourceScore}>
                            {Math.round(source.relevanceScore * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {ragResult.augmentedContext && (
                  <Card style={{ ...styles.resultCard, marginTop: '16px' }}>
                    <h4 style={styles.resultTitle}>📖 Retrieved Context</h4>
                    <p style={styles.contextText}>{ragResult.augmentedContext}</p>
                  </Card>
                )}

                {ragResult.sourcesCount === 0 && (
                  <Card style={{ ...styles.resultCard, marginTop: '24px' }}>
                    <p style={{ textAlign: 'center', color: '#94a3b8' }}>
                      No relevant content found. Try uploading more documents or using different keywords.
                    </p>
                  </Card>
                )}
              </>
            )}
          </Card>
        )}

      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  alert: {
    marginBottom: '20px'
  },
  alertInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  alertError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5'
  },
  alertSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac'
  },
  closeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    opacity: 0.6
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto'
  },
  tab: {
    padding: '10px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    color: '#0066cc',
    borderBottom: '2px solid #0066cc'
  },
  tabContent: {
    padding: '24px',
    borderRadius: '12px'
  },
  centerLoader: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    padding: '20px',
    textAlign: 'center',
    borderRadius: '12px'
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0066cc',
    margin: '8px 0'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1e293b'
  },
  documentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  docCard: {
    padding: '16px',
    borderRadius: '8px',
    transition: 'all 0.3s'
  },
  docHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px'
  },
  docInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    flex: 1
  },
  docName: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b'
  },
  docMeta: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#64748b'
  },
  badge: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  docStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '12px'
  },
  chapterList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  chapterLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    marginRight: '4px'
  },
  chapterTag: {
    padding: '2px 8px',
    backgroundColor: '#ede9fe',
    color: '#6d28d9',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  chapterMore: {
    fontSize: '11px',
    color: '#64748b',
    fontStyle: 'italic'
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  dangerBtn: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'monospace',
    minHeight: '120px',
    resize: 'vertical'
  },
  fileInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  fileInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer'
  },
  fileInputLabel: {
    padding: '10px 12px',
    border: '2px dashed #cbd5e1',
    borderRadius: '6px',
    flex: 1,
    cursor: 'pointer',
    color: '#64748b'
  },
  primaryBtn: {
    backgroundColor: '#0066cc',
    color: 'white'
  },
  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#f8fafc'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  progressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    transition: 'width 0.3s'
  },
  progressText: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    minWidth: '40px'
  },
  resultsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '24px',
    marginBottom: '16px',
    color: '#1e293b'
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  resultCard: {
    padding: '16px',
    borderRadius: '8px',
    borderLeft: '4px solid #0066cc'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '8px'
  },
  resultName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b'
  },
  relevanceScore: {
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#0c4a6e',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600'
  },
  resultSubject: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#64748b'
  },
  resultSnippet: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: '1.5'
  },
  resultTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  resultAnswer: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#334155'
  },
  validationDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  validationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    borderBottom: '1px solid #e2e8f0'
  },
  validationValue: {
    fontWeight: '600',
    color: '#0066cc'
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px'
  },
  sourceName: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b'
  },
  sourceSubject: {
    margin: '2px 0 0',
    fontSize: '11px',
    color: '#64748b'
  },
  sourceScore: {
    marginLeft: 'auto',
    padding: '2px 8px',
    backgroundColor: '#dbeafe',
    color: '#0c4a6e',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600'
  },
  contextText: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export default ContentLibrary;