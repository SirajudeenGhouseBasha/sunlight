/**
 * ImageField — common admin image input combining a system file upload
 * and a direct URL entry. Use everywhere an admin form needs an image
 * (brand logos, model mockups, case images, QR codes, etc.).
 *
 * Value contract: `value` is the current stored URL string; `onChange`
 * is called with the resolved URL (either the typed URL or the URL
 * returned by `onUpload` after uploading a system file).
 */

'use client';

import React, { useRef, useState } from 'react';
import { Upload, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toProxiedUrl } from '@/src/utils/image-url';

export interface ImageFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Uploads a system file and returns the stored URL. */
  onUpload: (file: File) => Promise<string>;
  required?: boolean;
  error?: string;
  helpText?: string;
  accept?: string;
  /** Max file size in MB for client-side validation. */
  maxSizeMB?: number;
  placeholder?: string;
  previewClassName?: string;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml';

export function ImageField({
  id,
  label,
  value,
  onChange,
  onUpload,
  required,
  error,
  helpText,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  placeholder = 'Paste an image URL',
  previewClassName = 'h-28',
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayUrl = toProxiedUrl(value);

  const validateFile = (file: File): string | null => {
    const allowed = accept.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(file.type.toLowerCase())) {
      return 'Please choose a valid image file.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File must be smaller than ${maxSizeMB} MB.`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    setUploadError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setIsUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const showError = error ?? uploadError;

  return (
    <div>
      <label htmlFor={`${id}-url`} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Preview / drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        } ${displayUrl ? 'p-0 overflow-hidden' : 'p-4'}`}
      >
        {displayUrl ? (
          <div className="relative group">
            <img
              src={displayUrl}
              alt={`${label} preview`}
              className={`w-full object-cover bg-white ${previewClassName}`}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove image"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center gap-2 cursor-pointer py-2"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
            <p className="text-sm text-gray-500">
              {isUploading ? 'Uploading…' : 'Drop an image here or click to upload'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP, SVG · max {maxSizeMB}MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id={`${id}-file`}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* URL entry */}
      <div className="mt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <ImageIcon className="w-4 h-4" />
          </span>
          <input
            id={`${id}-url`}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setUploadError(null); }}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload from device
        </button>
      </div>

      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {showError && <p className="mt-1 text-sm text-red-500">{showError}</p>}
    </div>
  );
}
