import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiPromptsApi, AiPrompt } from '@/api/ai-prompts';
import { Bot, Save, RotateCcw, ChevronDown, ChevronUp, Info, CheckCircle2, AlertCircle } from 'lucide-react';

// ── Variable pill ──────────────────────────────────────────────────────────

function VarPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
      {`{{${name}}}`}
    </span>
  );
}

// ── Single prompt card ─────────────────────────────────────────────────────

function PromptCard({ prompt }: { prompt: AiPrompt }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const saveMutation = useMutation({
    mutationFn: () => aiPromptsApi.update(prompt.key, { template: draft }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-prompts'] });
      setEditing(false);
      showToast('success', 'Prompt saved. New version will be used on next AI call.');
    },
    onError: () => showToast('error', 'Save failed. Please try again.'),
  });

  const resetMutation = useMutation({
    mutationFn: () => aiPromptsApi.reset(prompt.key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-prompts'] });
      showToast('success', 'Reset to hardcoded default.');
    },
    onError: () => showToast('error', 'Reset failed.'),
  });

  const handleEdit = () => {
    setDraft(prompt.template);
    setEditing(true);
    setExpanded(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft('');
  };

  const handleReset = () => {
    if (window.confirm(`Reset "${prompt.name}" to hardcoded default? The current DB override will be deleted.`)) {
      resetMutation.mutate();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-start space-x-3 min-w-0">
          <div className="flex-shrink-0 mt-0.5 w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900">{prompt.name}</h3>
              <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{prompt.key}</span>
              <span className="text-xs text-gray-400">v{prompt.version}</span>
            </div>
            {prompt.description && (
              <p className="text-xs text-gray-500 mt-0.5">{prompt.description}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {prompt.variables.map((v) => <VarPill key={v} name={v} />)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
          {!editing && (
            <button onClick={handleEdit} className="btn btn-secondary text-xs px-3 py-1.5">
              Edit
            </button>
          )}
          <button
            onClick={() => setExpanded((x) => !x)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-5 mb-3 flex items-center space-x-2 text-xs px-3 py-2 rounded-lg ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Body */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {editing ? (
            <>
              <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Use <code className="font-mono">{'{{variableName}}'}</code> placeholders. <code className="font-mono">{'{{knowledge_context}}'}</code> will be filled by RAG in Phase 2.</span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={18}
                className="w-full font-mono text-xs bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
                spellCheck={false}
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="btn btn-primary flex items-center space-x-1.5 text-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saveMutation.isPending ? 'Saving…' : 'Save Prompt'}</span>
                </button>
                <button onClick={handleCancel} className="btn btn-secondary text-sm">
                  Cancel
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleReset}
                  disabled={resetMutation.isPending}
                  className="flex items-center space-x-1.5 text-xs text-red-600 hover:text-red-700 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to default</span>
                </button>
              </div>
            </>
          ) : (
            <pre className="font-mono text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-5">
              {prompt.template}
            </pre>
          )}

          {/* Phase 2 RAG info */}
          {(prompt.kbQueryTemplate) && (
            <div className="flex items-start space-x-2 text-xs bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-violet-700">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">RAG enabled —</span> retrieves top {prompt.kbTopK} KB chunks using query: <code className="font-mono">{prompt.kbQueryTemplate}</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AiPrompts() {
  const { data: prompts = [], isLoading, isError } = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: aiPromptsApi.list,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Prompts</h1>
        <p className="mt-2 text-gray-600">
          Manage the prompt templates used by AI features across the platform. Changes take effect immediately — no deployment needed.
        </p>
      </div>

      {/* RAG roadmap notice */}
      <div className="flex items-start space-x-3 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-800">
        <Bot className="h-5 w-5 mt-0.5 flex-shrink-0 text-violet-600" />
        <div className="space-y-1">
          <p className="font-medium">Phase 2: RAG Enrichment</p>
          <p className="text-xs text-violet-700">
            The <code className="font-mono text-xs bg-violet-100 px-1 rounded">{'{{knowledge_context}}'}</code> placeholder in each template is reserved for Bedrock Knowledge Base retrieval.
            Once AWS Bedrock KB is enabled, relevant document chunks from the Knowledge Base will be automatically injected here at inference time — no prompt edits required.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent" />
        </div>
      )}

      {isError && (
        <div className="text-center py-8 text-red-600 text-sm">Failed to load prompts.</div>
      )}

      <div className="space-y-4">
        {prompts.map((p) => <PromptCard key={p.key} prompt={p} />)}
      </div>
    </div>
  );
}
