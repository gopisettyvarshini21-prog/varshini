import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  RefreshCw,
  Search,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  UploadCloud,
  Trash2,
  X,
  FolderOpen,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { UserAuth } from '../types';
import { getAccessToken, googleSignIn, googleSignInWithRedirect, subscribeAccessToken } from '../utils/auth';
import {
  listDriveFiles,
  readDriveFileContent,
  saveTextToDrive,
  deleteDriveFile,
  DriveFileSummary,
} from '../utils/driveUtils';

interface DriveHubProps {
  currentUser: UserAuth | null;
  activeDocumentTitle?: string;
  activeDocumentText?: string;
  onImportToEngine: (options: { fileName: string; content: string }) => void;
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DriveHub: React.FC<DriveHubProps> = ({
  currentUser,
  activeDocumentTitle = 'Situation_AI_Conversation_Brief.txt',
  activeDocumentText = '',
  onImportToEngine,
  isDark,
  themeStyles,
  onShowToast,
}) => {
  const [files, setFiles] = useState<DriveFileSummary[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveFileSummary | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Explicit Confirmation Modals (MANDATORY for mutating/destructive Workspace API actions)
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveFileName, setSaveFileName] = useState<string>(activeDocumentTitle);
  const [saveFileContent, setSaveFileContent] = useState<string>(activeDocumentText);
  const [deleteTarget, setDeleteTarget] = useState<DriveFileSummary | null>(null);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const [hasToken, setHasToken] = useState<boolean>(() => !!getAccessToken());

  useEffect(() => {
    setHasToken(!!getAccessToken());
    return subscribeAccessToken(setHasToken);
  }, []);

  const fetchFiles = async (queryToUse = searchQuery) => {
    if (!getAccessToken()) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listDriveFiles(queryToUse, 24);
      setFiles(list);
      if (list.length > 0 && !selectedFile) {
        handleSelectFile(list[0]);
      }
    } catch (err: any) {
      console.error('Drive list error:', err);
      setError(err.message || 'Could not load files from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasToken) {
      fetchFiles();
    }
  }, [hasToken]);

  const handleSignInGoogle = async () => {
    try {
      setIsLoading(true);
      await googleSignIn();
      onShowToast('Connected to Google Drive successfully!', 'success');
      await fetchFiles();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        onShowToast('Popup blocked. Switching to Google Redirect Sign-In...', 'info');
        await googleSignInWithRedirect().catch((e) =>
          onShowToast(`Redirect sign-in failed: ${e.message}`, 'error')
        );
      } else {
        onShowToast(`Google sign-in error: ${err.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = async (file: DriveFileSummary) => {
    setSelectedFile(file);
    setFilePreview('');
    const isReadable =
      file.mimeType.startsWith('text/') ||
      file.mimeType === 'application/json' ||
      file.mimeType === 'application/vnd.google-apps.document' ||
      file.mimeType === 'application/vnd.google-apps.spreadsheet' ||
      file.mimeType === 'application/vnd.google-apps.presentation';

    if (!isReadable) {
      setFilePreview(
        `Preview not available inline for binary/folder MIME type (${file.mimeType}). Use "Open in Drive" to view directly.`
      );
      return;
    }

    setIsReadingFile(true);
    try {
      const text = await readDriveFileContent(file.id, file.mimeType);
      setFilePreview(text || '(Empty file)');
    } catch (err: any) {
      setFilePreview(`Could not extract inline text: ${err.message}`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const openSaveToDriveModal = () => {
    setSaveFileName(
      activeDocumentTitle.endsWith('.txt') || activeDocumentTitle.endsWith('.md')
        ? activeDocumentTitle
        : `${activeDocumentTitle.replace(/[^\w\s-]/g, '').trim() || 'Situation_AI_Brief'}.txt`
    );
    setSaveFileContent(
      activeDocumentText.trim() ||
        'Prepared via Situation AI — Communication & Situational Intelligence Platform.'
    );
    setSaveModalOpen(true);
  };

  const handleConfirmSaveToDrive = async () => {
    if (!saveFileName.trim() || !saveFileContent.trim()) {
      onShowToast('Please specify a file name and content.', 'error');
      return;
    }
    setIsMutating(true);
    try {
      const created = await saveTextToDrive({
        name: saveFileName.trim(),
        content: saveFileContent,
        mimeType: saveFileName.endsWith('.md') ? 'text/markdown' : 'text/plain',
      });
      onShowToast(`Saved "${created.name}" to your Google Drive!`, 'success');
      setSaveModalOpen(false);
      await fetchFiles(searchQuery);
    } catch (err: any) {
      onShowToast(`Save to Drive failed: ${err.message}`, 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!deleteTarget) return;
    setIsMutating(true);
    try {
      await deleteDriveFile(deleteTarget.id);
      onShowToast(`Deleted "${deleteTarget.name}" from Google Drive.`, 'info');
      if (selectedFile?.id === deleteTarget.id) {
        setSelectedFile(null);
        setFilePreview('');
      }
      setDeleteTarget(null);
      await fetchFiles(searchQuery);
    } catch (err: any) {
      onShowToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <FolderOpen className="w-4 h-4 text-amber-400" />;
    }
    if (mimeType === 'application/vnd.google-apps.spreadsheet' || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    }
    if (mimeType.includes('json') || mimeType.includes('markdown')) {
      return <FileCode className="w-4 h-4 text-purple-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
            <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
              Google Drive Workspace Vault
            </h2>
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            Browse your Google Drive documents, import context into the AI Reply Engine, and save conversation briefs to Drive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasToken ? (
            <>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Drive Connected ({currentUser?.email || 'Google'})</span>
              </span>
              <button
                type="button"
                onClick={openSaveToDriveModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Save Brief to Drive</span>
              </button>
              <button
                type="button"
                onClick={() => fetchFiles()}
                disabled={isLoading}
                className={`p-2 rounded-xl border text-xs transition-all ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                title="Refresh Google Drive Files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {!hasToken ? (
        <div
          className={`p-8 sm:p-12 rounded-3xl border text-center transition-all ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className={`text-lg font-black ${themeStyles.textPrimary}`}>
            Sign In with Google to Access Your Drive Files
          </h3>
          <p className={`text-xs max-w-lg mx-auto mt-2 leading-relaxed ${themeStyles.textMuted}`}>
            Import Google Docs, meeting notes, or text transcripts straight into Situation AI for instant analysis, and archive generated executive reports directly to your Google Drive.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isLoading}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 shadow-lg transition-all"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search Bar */}
          <div
            className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Google Drive files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchFiles(searchQuery);
                  }
                }}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchFiles(searchQuery)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchFiles('');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#161B22] border-slate-700 border-l-4 border-l-rose-500 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => fetchFiles()} className="font-bold underline">
                Retry
              </button>
            </div>
          )}

          {/* Split File Browser & Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-1 block ${themeStyles.textSecondary}`}>
                Recent Drive Files ({files.length})
              </span>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {files.length === 0 && !isLoading ? (
                  <div
                    className={`p-8 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className={`text-xs font-bold ${themeStyles.textPrimary}`}>No Drive files found</p>
                  </div>
                ) : (
                  files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFile(file)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                              : 'bg-emerald-50/50 border-emerald-500 shadow-md ring-1 ring-emerald-400'
                            : isDark
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(file.mimeType)}
                            <span className={`text-xs font-bold truncate ${themeStyles.textPrimary}`}>
                              {file.name}
                            </span>
                          </div>
                          {file.modifiedTime && (
                            <span className={`text-[10px] shrink-0 ${themeStyles.textMuted}`}>
                              {new Date(file.modifiedTime).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10.5px] mt-1 truncate ${themeStyles.textMuted}`}>
                          {file.mimeType.replace('application/vnd.google-apps.', 'Google ')}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              {selectedFile ? (
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(selectedFile.mimeType)}
                      <h3 className={`text-sm font-black truncate ${themeStyles.textPrimary}`}>
                        {selectedFile.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedFile.webViewLink && (
                        <a
                          href={selectedFile.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                            isDark
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open in Drive</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selectedFile)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-[11px] font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${themeStyles.textMuted}`}>
                      Extracted Content Preview
                    </label>
                    <div
                      className={`p-4 rounded-xl border text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {isReadingFile ? (
                        <span className="flex items-center gap-2 text-emerald-400">
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          Loading content from Google Drive...
                        </span>
                      ) : (
                        filePreview || 'Select a readable document to preview its text.'
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={!filePreview || isReadingFile}
                      onClick={() => {
                        onImportToEngine({
                          fileName: selectedFile.name,
                          content: filePreview,
                        });
                        onShowToast(`Imported "${selectedFile.name}" into Situation AI Reply Engine!`, 'success');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Import into AI Reply Engine</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-10 rounded-2xl border text-center ${
                    isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                    Select a file from Google Drive to inspect or import
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal: Save / Upload File to Google Drive */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !isMutating && setSaveModalOpen(false)}
          />
          <div
            className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl z-10 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${themeStyles.textPrimary}`}>
                    Confirm Upload to Google Drive
                  </h3>
                  <p className={`text-[11px] ${themeStyles.textMuted}`}>
                    Review the file name and contents before saving to your Drive
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  File Name
                </label>
                <input
                  type="text"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  File Content
                </label>
                <textarea
                  rows={7}
                  value={saveFileContent}
                  onChange={(e) => setSaveFileContent(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                  isDark ? 'bg-[#161B22] border-slate-700 text-slate-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>This will create "{saveFileName}" in your connected Google Drive account.</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirmSaveToDrive}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md disabled:opacity-50"
              >
                {isMutating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>Confirm & Save to Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal: Delete File from Google Drive */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !isMutating && setDeleteTarget(null)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl z-10 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-black ${themeStyles.textPrimary}`}>
                  Delete File from Google Drive?
                </h3>
                <p className={`text-[11px] ${themeStyles.textMuted}`}>This action removes the file permanently.</p>
              </div>
            </div>
            <p className={`text-xs leading-relaxed mb-4 ${themeStyles.textSecondary}`}>
              Are you sure you want to permanently delete <strong>"{deleteTarget.name}"</strong> from your Google Drive?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirmDeleteFile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
              >
                {isMutating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
