import { useCallback, useState } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

export default function FileUploader({
  onFileSelect,
  acceptedTypes = ['.xlsx', '.csv', '.xls'],
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }

    // Check file type
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedTypes.includes(fileExt)) {
      setError(
        `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`,
      );
      return false;
    }

    setError('');
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleRemove = () => {
    setSelectedFile(null);
    setError('');
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <Upload
            className={`mx-auto h-12 w-12 ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Choose a file
              </span>
              <span className="text-gray-600"> or drag and drop</span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept={acceptedTypes.join(',')}
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {acceptedTypes.join(', ').toUpperCase()} up to {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 rounded hover:bg-green-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
}
