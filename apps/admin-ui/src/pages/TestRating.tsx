import { useState } from 'react';
import { useProductLine } from '@/contexts/ProductLineContext';
import { useMutation } from '@tanstack/react-query';
import { productLinesApi } from '@/api/product-lines';
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

const SAMPLE_REQUEST = {
  quoteNumber: 'QTE-2026-001',
  productCode: 'GL',
  insured: {
    name: 'ABC Construction Inc',
    businessType: 'construction',
    state: 'CA',
    annualRevenue: 6000000,
  },
  classification: {
    code: '91580',
  },
  coverages: [
    {
      type: 'general-liability',
      limit: 1000000,
      deductible: 5000,
    },
  ],
};

export default function TestRating() {
  const { currentProductLine } = useProductLine();
  const [requestData, setRequestData] = useState(JSON.stringify(SAMPLE_REQUEST, null, 2));
  const [result, setResult] = useState<any>(null);

  const executeMutation = useMutation({
    mutationFn: (data: any) =>
      productLinesApi.executeRating(currentProductLine!, { data }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: any) => {
      setResult({
        success: false,
        error: {
          message: error.message || 'Execution failed',
        },
      });
    },
  });

  const handleExecute = () => {
    try {
      const data = JSON.parse(requestData);
      executeMutation.mutate(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: {
          message: `Invalid JSON: ${error.message}`,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Rating Execution</h1>
        <p className="mt-2 text-gray-600">
          Test your product line configuration with sample data
        </p>
      </div>

      {!currentProductLine && (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            Please select a product line from the selector above
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Request Data</h2>
            <button
              onClick={() => setRequestData(JSON.stringify(SAMPLE_REQUEST, null, 2))}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Reset to Sample
            </button>
          </div>
          <textarea
            value={requestData}
            onChange={(e) => setRequestData(e.target.value)}
            className="input font-mono text-xs"
            rows={20}
            placeholder="Enter request JSON..."
          />
          <button
            onClick={handleExecute}
            disabled={!currentProductLine || executeMutation.isPending}
            className="mt-4 w-full btn btn-primary flex items-center justify-center space-x-2"
          >
            <PlayCircle className="h-4 w-4" />
            <span>{executeMutation.isPending ? 'Executing...' : 'Execute Rating'}</span>
          </button>
        </div>

        {/* Response */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Response</h2>
          {!result ? (
            <div className="text-center py-12 text-gray-500">
              <PlayCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">Click "Execute Rating" to test</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>

              {/* Result Data */}
              {result.success && result.result && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Result</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-500">Premium:</span>{' '}
                        <span className="font-semibold">${result.result.premium}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rating Engine:</span>{' '}
                        {result.result.ratingEngine}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {result.metadata && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Execution Metadata</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{result.metadata.executionTimeMs}ms</span>
                    </div>
                    {result.metadata.rulesApplied && result.metadata.rulesApplied.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Rules Applied:</p>
                        <ul className="mt-1 text-sm space-y-1">
                          {result.metadata.rulesApplied.map((rule: string, i: number) => (
                            <li key={i} className="text-gray-700">• {rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Steps */}
              {result.metadata?.steps && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Workflow Steps</h3>
                  <div className="space-y-2">
                    {result.metadata.steps.map((step: any) => (
                      <div
                        key={step.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          step.success ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {step.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">{step.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{step.duration}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="mt-1 text-sm text-red-700">{result.error.message}</p>
                </div>
              )}

              {/* Full Response */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Full Response</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
