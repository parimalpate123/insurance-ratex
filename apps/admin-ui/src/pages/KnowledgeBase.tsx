import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeBaseApi, KBDocument } from '@/api/knowledge-base';
import { useProductLine } from '@/contexts/ProductLineContext';
import { BookOpen, Upload, Trash2, Download, RefreshCw, FileText, File, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { useRef, useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; hint: string }> = {
  ready: {
    label: 'Ready',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-3 w-3" />,
    hint: 'Text extracted and searchable',
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800',
    icon: <Loader className="h-3 w-3 animate-spin" />,
    hint: 'Extracting text...',
  },
  pending: {
    label: 'Stored in S3',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-3 w-3" />,
    hint: 'Saved to S3. PDF/Word text extraction requires AWS Textract (enabled on AWS deployment).',
  },
  error: {
    label: 'Error',
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="h-3 w-3" />,
    hint: 'Processing failed — see error below',
  },
};

const FileIcon = ({ type }: { type: string }) => {
  const cls = 'h-9 w-9';
  if (type === 'pdf') return <FileText className={`${cls} text-red-500`} />;
  if (type === 'docx' || type === 'doc') return <FileText className={`${cls} text-blue-500`} />;
  if (type === 'xlsx' || type === 'csv') return <FileText className={`${cls} text-green-500`} />;
  return <File className={`${cls} text-gray-400`} />;
};

// ── Upload queue item ──────────────────────────────────────────────────────

interface UploadItem {
  id: string;
  file: File;
  progress: number;           // 0-100 (network upload to server)
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const { selectedProductLine } = useProductLine();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<UploadItem[]>([]);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['knowledge-base', selectedProductLine?.code],
    queryFn: () => knowledgeBaseApi.getAll(selectedProductLine?.code),
    // Auto-refresh every 5 sec while any doc is pending/processing
    refetchInterval: (query) => {
      const docs = query.state.data as KBDocument[] | undefined;
      const hasActive = docs?.some((d) => d.aiStatus === 'pending' || d.aiStatus === 'processing');
      return hasActive ? 5000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base'] }),
  });

  const reprocessMutation = useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.reprocess(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base'] }),
  });

  const updateItem = (id: string, patch: Partial<UploadItem>) =>
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Add all files to queue as "queued"
    const newItems: UploadItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'queued',
    }));
    setQueue((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Upload sequentially so progress bars are clear
    for (const item of newItems) {
      updateItem(item.id, { status: 'uploading', progress: 0 });
      try {
        await knowledgeBaseApi.upload(
          item.file,
          { productLineCode: selectedProductLine?.code },
          (percent) => updateItem(item.id, { progress: percent }),
        );
        updateItem(item.id, { status: 'done', progress: 100 });
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Upload failed';
        updateItem(item.id, { status: 'error', error: msg });
      }
    }

    // Refresh document list after all uploads
    queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });

    // Clear queue after 4 seconds
    setTimeout(() => setQueue([]), 4000);
  };

  const handleDownload = async (doc: KBDocument) => {
    try {
      const { url } = await knowledgeBaseApi.getDownloadUrl(doc.id);
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Download failed: ' + err.message);
    }
  };

  const anyUploading = queue.some((q) => q.status === 'uploading' || q.status === 'queued');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600 mt-1">
            Upload documents for AI-powered Q&A and rule generation
            {selectedProductLine && ` for ${selectedProductLine.name}`}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.csv,.txt,.md,.json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={anyUploading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{anyUploading ? 'Uploading...' : 'Upload Documents'}</span>
          </button>
        </div>
      </div>

      {/* Upload queue — shown while uploading */}
      {queue.length > 0 && (
        <div className="card border-2 border-primary-200 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Upload Progress</h2>
          {queue.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 truncate max-w-xs">{item.file.name}</span>
                <span className={`text-xs font-medium ${
                  item.status === 'done' ? 'text-green-600' :
                  item.status === 'error' ? 'text-red-600' :
                  item.status === 'uploading' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {item.status === 'queued' && 'Waiting...'}
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'done' && 'Uploaded'}
                  {item.status === 'error' && 'Failed'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.status === 'done' ? 'bg-green-500' :
                    item.status === 'error' ? 'bg-red-500' :
                    item.status === 'uploading' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}
                  style={{ width: `${item.status === 'done' ? 100 : item.progress}%` }}
                />
              </div>
              {item.status === 'error' && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-3">
          <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">Supported: PDF, Word (.docx), Excel (.xlsx), CSV, Text (.txt), Markdown (.md)</p>
            <p>
              <span className="font-medium">Local (MinIO):</span> Files are stored in S3 immediately.
              Text is auto-extracted for <code>.txt</code> / <code>.md</code> → status shows <span className="text-green-700 font-medium">Ready</span>.
            </p>
            <p>
              <span className="font-medium">AWS deployment:</span> PDF/Word text extraction via Textract + vector embeddings via Bedrock → all files become <span className="text-green-700 font-medium">Ready</span> with full AI search.
            </p>
          </div>
        </div>
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-4">
            Upload underwriting guidelines, rate manuals, and policy forms.
            <br />
            AI will use these to assist with rule generation and Q&A.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const cfg = STATUS_CONFIG[doc.aiStatus] ?? STATUS_CONFIG.pending;
            return (
              <div key={doc.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <FileIcon type={doc.fileType ?? 'txt'} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{doc.filename}</h3>
                      {/* Status badge with tooltip */}
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} cursor-help`}
                        title={cfg.hint}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      {doc.fileSizeBytes && <span>{formatBytes(doc.fileSizeBytes)}</span>}
                      {doc.fileType && <span className="uppercase font-medium">{doc.fileType}</span>}
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      {(doc.chunkCount ?? 0) > 0 && (
                        <span className="text-green-600">{doc.chunkCount} text chunks</span>
                      )}
                    </div>

                    {/* Status explanation (shown inline for pending/error) */}
                    {doc.aiStatus === 'pending' && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Stored in S3. Text extraction will run automatically on AWS deployment (AWS Textract).
                      </p>
                    )}
                    {doc.aiStatus === 'error' && doc.processingError && (
                      <p className="text-xs text-red-600 mt-1">{doc.processingError}</p>
                    )}
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{doc.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {doc.s3Key && (
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Download from S3"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => reprocessMutation.mutate(doc.id)}
                      disabled={reprocessMutation.isPending}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Request reprocessing"
                    >
                      <RefreshCw className={`h-4 w-4 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${doc.filename}" from Knowledge Base and S3?`)) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
