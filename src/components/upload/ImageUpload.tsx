/**
 * Image Upload Component
 * 
 * Drag-and-drop image upload with validation and preview
 * Requirements: 4.1, 4.4, 8.1 - Image upload and processing
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  validateImage,
  getImageDimensions,
  compressImage,
  createThumbnail,
  formatFileSize,
  isImageFile,
  IMAGE_VALIDATION,
} from '@/src/lib/storage/images';

export interface ImageUploadProps {
  onUpload: (file: File, thumbnail?: File) => Promise<void>;
  onError?: (error: string) => void;
  maxSize?: number;
  compress?: boolean;
  generateThumbnail?: boolean;
  accept?: string;
  className?: string;
}

export default function ImageUpload({
  onUpload,
  onError,
  maxSize = IMAGE_VALIDATION.MAX_FILE_SIZE,
  compress = true,
  generateThumbnail = true,
  accept = IMAGE_VALIDATION.ALLOWED_TYPES.join(','),
  className = '',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleError = useCallback(
    (error: string) => {
      if (onError) {
        onError(error);
      }
      setValidationErrors([error]);
    },
    [onError]
  );

  const validateAndSetFile = useCallback(
    async (file: File) => {
      setValidationErrors([]);
      setPreview(null);
      setDimensions(null);
      setSelectedFile(null);

      // Check if it's an image
      if (!isImageFile(file)) {
        handleError('Please select a valid image file');
        return;
      }

      // Validate image
      const validation = await validateImage(file);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Get dimensions
      try {
        const dims = await getImageDimensions(file);
        setDimensions(dims);
      } catch (error) {
        handleError('Failed to read image dimensions');
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setSelectedFile(file);
    },
    [handleError]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
    },
    [validateAndSetFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
    },
    [validateAndSetFile]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setValidationErrors([]);

    try {
      let fileToUpload = selectedFile;
      let thumbnailFile: File | undefined;

      // Compress image if enabled
      if (compress) {
        fileToUpload = await compressImage(selectedFile);
      }

      // Generate thumbnail if enabled
      if (generateThumbnail) {
        thumbnailFile = await createThumbnail(selectedFile);
      }

      // Call upload handler
      await onUpload(fileToUpload, thumbnailFile);

      // Reset state
      setPreview(null);
      setSelectedFile(null);
      setDimensions(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      handleError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
    setDimensions(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag and Drop Area */}
      {!preview && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            hover:border-blue-400 hover:bg-blue-50 cursor-pointer
          `}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-3">
            <div className="text-5xl">📸</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Drop image here' : 'Drag & drop your image'}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Supported: JPG, PNG, WebP, GIF</p>
              <p>Max size: {formatFileSize(maxSize)}</p>
              <p>
                Min: {IMAGE_VALIDATION.MIN_DIMENSIONS.width}x
                {IMAGE_VALIDATION.MIN_DIMENSIONS.height}px
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-medium text-red-800 mb-2">Validation Errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview && selectedFile && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-300">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
            />
          </div>

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">File name:</span>
              <span className="font-medium text-gray-900 truncate ml-2">
                {selectedFile.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File size:</span>
              <span className="font-medium text-gray-900">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
            {dimensions && (
              <div className="flex justify-between">
                <span className="text-gray-600">Dimensions:</span>
                <span className="font-medium text-gray-900">
                  {dimensions.width} × {dimensions.height}px
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="h-12 flex-1 text-base"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isUploading}
              variant="outline"
              className="h-12 flex-1 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
