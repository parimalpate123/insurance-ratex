import { useState, useMemo } from 'react';
import { X, Check, ArrowRight, Info, Filter } from 'lucide-react';

interface MappingSuggestion {
  sourcePath: string;
  targetPath: string;
  transformationType?: string;
  transformationConfig?: any;
  confidence: number;
  reasoning?: string;
}

interface MappingPreviewModalProps {
  suggestions: MappingSuggestion[];
  onClose: () => void;
  onAccept: (acceptedSuggestions: MappingSuggestion[]) => void;
}

export default function MappingPreviewModal({
  suggestions,
  onClose,
  onAccept,
}: MappingPreviewModalProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set(suggestions.map((_, i) => i)),
  );
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium'>('all');

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      if (confidenceFilter === 'high') return s.confidence >= 80;
      if (confidenceFilter === 'medium') return s.confidence >= 60 && s.confidence < 80;
      return true;
    });
  }, [suggestions, confidenceFilter]);

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const toggleAll = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
    }
  };

  const acceptAllHighConfidence = () => {
    const highConfidenceIndices = suggestions
      .map((s, i) => (s.confidence >= 80 ? i : -1))
      .filter((i) => i >= 0);
    setSelectedSuggestions(new Set(highConfidenceIndices));
  };

  const handleAccept = () => {
    const accepted = suggestions.filter((_, i) => selectedSuggestions.has(i));
    onAccept(accepted);
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const averageConfidence = useMemo(() => {
    if (suggestions.length === 0) return 0;
    return Math.round(
      suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length,
    );
  }, [suggestions]);

  const highConfidenceCount = useMemo(() => {
    return suggestions.filter((s) => s.confidence >= 80).length;
  }, [suggestions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review AI-Generated Mappings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {suggestions.length} suggestions generated •{' '}
                {selectedSuggestions.size} selected • Average confidence:{' '}
                {averageConfidence}%
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium text-green-600">
                  {highConfidenceCount}
                </span>{' '}
                <span className="text-gray-600">high confidence (≥80%)</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-yellow-600">
                  {suggestions.filter((s) => s.confidence >= 60 && s.confidence < 80).length}
                </span>{' '}
                <span className="text-gray-600">medium (60-79%)</span>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value as any)}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="all">All Suggestions</option>
                <option value="high">High Confidence Only</option>
                <option value="medium">Medium Confidence Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedSuggestions.size === suggestions.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={acceptAllHighConfidence}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Accept All High Confidence
            </button>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-all ${
                  selectedSuggestions.has(index)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedSuggestions.has(index)}
                    onChange={() => toggleSuggestion(index)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded"
                  />

                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        {/* Source */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            SOURCE
                          </div>
                          <div className="font-mono text-sm text-gray-900">
                            {suggestion.sourcePath}
                          </div>
                        </div>

                        {/* Transformation */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            TRANSFORMATION
                          </div>
                          <div className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm capitalize">
                              {suggestion.transformationType || 'direct'}
                            </span>
                          </div>
                          {suggestion.transformationConfig && (
                            <div className="text-xs text-gray-500 mt-1">
                              {JSON.stringify(suggestion.transformationConfig)}
                            </div>
                          )}
                        </div>

                        {/* Target */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            TARGET
                          </div>
                          <div className="font-mono text-sm text-gray-900">
                            {suggestion.targetPath}
                          </div>
                        </div>
                      </div>

                      {/* Confidence Badge */}
                      <div
                        className={`ml-4 px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(
                          suggestion.confidence,
                        )}`}
                      >
                        {suggestion.confidence}%
                      </div>
                    </div>

                    {/* Reasoning */}
                    {suggestion.reasoning && (
                      <div className="mt-3 flex items-start text-xs text-gray-600 bg-white rounded p-2 border border-gray-100">
                        <Info className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>{suggestion.reasoning}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSuggestions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No suggestions match the current filter
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedSuggestions.size}</span> of{' '}
              <span className="font-medium">{suggestions.length}</span> mappings
              selected
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleAccept}
                disabled={selectedSuggestions.size === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 mr-2" />
                Create Mapping ({selectedSuggestions.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
