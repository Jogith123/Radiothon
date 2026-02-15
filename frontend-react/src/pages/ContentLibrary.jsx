/**
 * Content Library — flat, institutional design, no emojis
 */

import React, { useState, useEffect } from 'react';
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
  Link,
  Tag,
  Calendar,
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

const tabs = [
  { key: 'library', label: 'Library', icon: BookOpen },
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'search', label: 'Search', icon: Search },
  { key: 'validate', label: 'Validate', icon: CheckSquare },
  { key: 'generate', label: 'Generate', icon: Database },
];

const inputClass = 'px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#111827] focus:ring-2 focus:ring-[#1E293B]/30 focus:border-[#1E293B] outline-none transition-colors';

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

  const statIcons = [
    { icon: FileText, label: 'Documents' },
    { icon: BookOpen, label: 'Chapters' },
    { icon: Link, label: 'Chunks' },
    { icon: Tag, label: 'Subjects' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Content Library"
        description="Manage your RAG knowledge base documents"
      />

      {/* Alert Messages */}
      {error && (
        <div className="mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-lg opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer">&times;</button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
            <CheckCircle size={16} />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-lg opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer">&times;</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 pb-3 border-b border-[#E5E7EB] overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setError(null); setSuccess(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors border-b-2 -mb-[3px] bg-transparent cursor-pointer ${
                activeTab === tab.key
                  ? 'text-[#1E293B] border-[#1E293B]'
                  : 'text-[#6B7280] border-transparent hover:text-[#111827]'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-[#6B7280]">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading library...</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { value: stats.totalDocuments },
                    { value: stats.totalChapters || 0 },
                    { value: stats.totalChunks },
                    { value: stats.subjects.length },
                  ].map((stat, i) => {
                    const StatIcon = statIcons[i].icon;
                    return (
                      <div key={statIcons[i].label} className="bg-white rounded-[10px] border border-[#E5E7EB] p-5 text-center">
                        <div className="flex justify-center mb-2">
                          <StatIcon size={20} className="text-[#4B5563]" />
                        </div>
                        <div className="text-2xl font-semibold text-[#111827]">{stat.value}</div>
                        <div className="text-xs text-[#6B7280] uppercase mt-1">{statIcons[i].label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Documents List */}
                {documents.length > 0 ? (
                  <>
                    <h3 className="text-sm font-semibold mb-4 text-[#111827]">Documents ({documents.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                      {documents.map(doc => (
                        <div key={doc._id} className="bg-white rounded-[10px] border border-[#E5E7EB] p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex gap-3 items-start flex-1 min-w-0">
                              <FileText size={18} className="text-[#4B5563] shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <h4 className="text-sm font-medium text-[#111827] truncate">{doc.fileName}</h4>
                                <p className="text-xs text-[#6B7280] mt-0.5">{doc.subject} &bull; {doc.wordCount?.toLocaleString() || '?'} words</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-[#F0F2F5] text-[#4B5563] rounded text-[11px] font-medium uppercase shrink-0">
                              {doc.fileType}
                            </span>
                          </div>

                          <div className="flex gap-3 text-xs text-[#6B7280] mb-3">
                            <span>{doc.chapters?.length || 0} chapters</span>
                            <span>{doc.totalChunks || 0} chunks</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>

                          {doc.chapterTitles && doc.chapterTitles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center mb-3">
                              <span className="text-[11px] font-medium text-[#6B7280] mr-1">Chapters:</span>
                              {doc.chapterTitles.slice(0, 5).map((title, i) => (
                                <span key={i} className="px-2 py-0.5 bg-[#F0F2F5] text-[#4B5563] rounded text-[11px] font-medium max-w-[200px] truncate">
                                  {title}
                                </span>
                              ))}
                              {doc.chapterTitles.length > 5 && (
                                <span className="text-[11px] text-[#6B7280]">+{doc.chapterTitles.length - 5} more</span>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleDelete(doc._id)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF2F2] text-[#B91C1C] rounded-md text-xs font-medium hover:bg-[#FEE2E2] transition-colors disabled:opacity-50 border-none cursor-pointer"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleClearLibrary}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      <Trash2 size={15} /> Clear All Documents
                    </button>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Database size={40} className="mx-auto mb-4 text-[#6B7280]" />
                    <h3 className="text-sm font-semibold text-[#111827] mb-1">No documents yet</h3>
                    <p className="text-sm text-[#6B7280]">Upload your first document to get started</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6">
            <h3 className="text-sm font-semibold mb-5 text-[#111827]">Upload Document</h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#4B5563]">Select File (PDF, DOCX, TXT)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={loading}
                  />
                  <div className="px-4 py-3 border-2 border-dashed border-[#E5E7EB] rounded-lg text-[#6B7280] text-sm cursor-pointer hover:border-[#1E293B] transition-colors">
                    {selectedFile ? selectedFile.name : 'Choose file...'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#4B5563]">Subject/Category</label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={e => setUploadSubject(e.target.value)}
                  placeholder="e.g., FAQ, Documentation, Guide"
                  className={inputClass}
                  disabled={loading}
                />
              </div>

              {uploadProgress > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E293B] rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-[#6B7280] min-w-[40px]">{uploadProgress}%</span>
                </div>
              )}

              <Button onClick={handleUpload} disabled={loading || !selectedFile} variant="primary">
                <Upload size={15} /> {loading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6">
            <h3 className="text-sm font-semibold mb-5 text-[#111827]">Search Content Library</h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#4B5563]">Search Query</label>
                <div className="flex items-center gap-2 px-3 py-2.5 border border-[#E5E7EB] rounded-lg bg-white">
                  <Search size={16} className="text-[#6B7280]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter search query..."
                    className="flex-1 border-none bg-transparent text-sm outline-none text-[#111827] placeholder-[#9CA3AF]"
                    disabled={searching}
                  />
                </div>
              </div>

              <Button onClick={handleSearch} disabled={searching || !searchQuery} variant="primary">
                <Search size={15} /> {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <>
                <h4 className="text-sm font-semibold mt-6 mb-4 text-[#111827]">Results ({searchResults.length})</h4>
                <div className="flex flex-col gap-3">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="bg-[#F6F7F9] p-4 rounded-lg border-l-4 border-l-[#1E293B]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-[#111827]">{result.fileName}</h4>
                        <span className="px-2 py-0.5 bg-[#F0F2F5] text-[#4B5563] rounded text-xs font-medium">
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-2">
                        {result.chapterTitle || 'Unknown'} &bull; {result.subject}
                      </p>
                      {result.relevantChunk && (
                        <p className="text-sm text-[#4B5563] leading-relaxed">
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
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6">
            <h3 className="text-sm font-semibold mb-5 text-[#111827]">Validate Response Quality</h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#4B5563]">Response Text</label>
                <textarea
                  value={validationText}
                  onChange={e => setValidationText(e.target.value)}
                  placeholder="Enter response to validate..."
                  className={`${inputClass} font-mono min-h-[120px] resize-y`}
                  disabled={loading}
                />
              </div>

              <Button onClick={handleValidate} disabled={loading || !validationText} variant="primary">
                <CheckSquare size={15} /> Validate
              </Button>
            </div>

            {validationResult && (
              <div className="bg-[#F6F7F9] p-4 rounded-lg border-l-4 border-l-[#1E293B] mt-6">
                <h4 className="text-sm font-semibold mb-4 text-[#111827]">Validation Result</h4>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Status', value: validationResult.validation.isValid ? 'Valid' : 'Invalid', color: validationResult.validation.isValid ? 'text-[#15803D]' : 'text-[#B91C1C]' },
                    { label: 'Quality Score', value: `${(validationResult.validation.score * 100).toFixed(0)}%` },
                    { label: 'Word Count', value: validationResult.validation.wordCount },
                    { label: 'Sentences', value: validationResult.validation.sentences },
                    { label: 'Message', value: validationResult.validation.reason },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 text-sm border-b border-[#E5E7EB] last:border-0">
                      <span className="text-[#6B7280]">{row.label}</span>
                      <span className={`font-medium ${row.color || 'text-[#111827]'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate RAG Tab */}
        {activeTab === 'generate' && (
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6">
            <h3 className="text-sm font-semibold mb-2 text-[#111827]">Test RAG Retrieval</h3>
            <p className="text-sm text-[#6B7280] mb-5">
              Enter a question to see which chapters and chunks the RAG system retrieves from your knowledge base.
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#4B5563]">User Query</label>
                <input
                  type="text"
                  value={ragQuery}
                  onChange={e => setRagQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateRag()}
                  placeholder="Ask a question about your uploaded documents..."
                  className={inputClass}
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
                  <div className="bg-[#F6F7F9] p-4 rounded-lg border-l-4 border-l-[#1E293B] mt-6">
                    <h4 className="text-sm font-semibold mb-4 text-[#111827]">Sources Found ({ragResult.sourcesCount})</h4>
                    <div className="flex flex-col gap-2">
                      {ragResult.sources.map((source, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-md border border-[#E5E7EB]">
                          <FileText size={15} className="text-[#4B5563] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#111827] truncate">{source.chapterTitle || source.fileName}</p>
                            <p className="text-[11px] text-[#6B7280]">{source.fileName} &bull; {source.subject}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-[#F0F2F5] text-[#4B5563] rounded text-[11px] font-medium shrink-0">
                            {Math.round(source.relevanceScore * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ragResult.augmentedContext && (
                  <div className="bg-[#F6F7F9] p-4 rounded-lg border-l-4 border-l-[#1E293B] mt-4">
                    <h4 className="text-sm font-semibold mb-3 text-[#111827]">Retrieved Context</h4>
                    <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap break-words">
                      {ragResult.augmentedContext}
                    </p>
                  </div>
                )}

                {ragResult.sourcesCount === 0 && (
                  <div className="bg-[#F6F7F9] p-6 rounded-lg mt-6 text-center border border-[#E5E7EB]">
                    <p className="text-[#6B7280] text-sm">
                      No relevant content found. Try uploading more documents or using different keywords.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ContentLibrary;
