/**
 * User Designs Page
 * 
 * Interface for users to upload and manage their custom designs
 * Requirements: 4.5, 5.1, 5.2 - Design management
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import ImageUpload from '@/src/components/upload/ImageUpload';
import { getImageDimensions } from '@/src/lib/storage/images';

interface Design {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  is_public: boolean;
  file_size?: number;
  dimensions?: { width: number; height: number };
  created_at: string;
}

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [designName, setDesignName] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const response = await fetch('/api/designs');
      const data = await response.json();
      setDesigns(data.designs || []);
    } catch (err) {
      setError('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, thumbnail?: File) => {
    if (!designName.trim()) {
      setError('Please enter a design name');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Upload image to storage
      const formData = new FormData();
      formData.append('file', file);
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }
      formData.append('bucket', 'designs');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      // Create design record
      const designResponse = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designName,
          description: designDescription,
          image_url: uploadData.image_url,
          thumbnail_url: uploadData.thumbnail_url,
          is_public: isPublic,
          file_size: uploadData.file_size,
          dimensions,
        }),
      });

      const designData = await designResponse.json();

      if (!designResponse.ok) {
        throw new Error(designData.error || 'Failed to create design');
      }

      setSuccess('Design uploaded successfully!');
      setShowUpload(false);
      setDesignName('');
      setDesignDescription('');
      setIsPublic(false);
      fetchDesigns();
    } catch (err: any) {
      setError(err.message || 'Failed to upload design');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const response = await fetch(`/api/designs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete design');
      }

      setSuccess('Design deleted!');
      fetchDesigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Designs</h1>
              <p className="text-sm text-gray-600 mt-1">Upload & manage designs</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-6xl mx-auto">
        <div className="space-y-4">
          
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Upload Button */}
          <Button 
            onClick={() => setShowUpload(!showUpload)} 
            className="h-11 w-full"
            disabled={uploading}
          >
            {showUpload ? '✕ Cancel Upload' : '+ Upload New Design'}
          </Button>

          {/* Upload Form */}
          {showUpload && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Design</CardTitle>
                <CardDescription>
                  Upload your custom phone case design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Design Name *</Label>
                  <Input
                    id="name"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="My Awesome Design"
                    required
                    className="h-11 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={designDescription}
                    onChange={(e) => setDesignDescription(e.target.value)}
                    placeholder="Optional description"
                    className="h-11 mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <Label htmlFor="is_public" className="cursor-pointer">
                    Make this design public (others can see it)
                  </Label>
                </div>

                <ImageUpload
                  onUpload={handleUpload}
                  onError={setError}
                  compress={true}
                  generateThumbnail={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Designs Grid */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Loading designs...
              </CardContent>
            </Card>
          ) : designs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">🎨</div>
                <p className="text-gray-500 mb-4">No designs yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Upload your first custom design to get started
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  Upload Design
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((design) => (
                <Card key={design.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={design.thumbnail_url || design.image_url}
                      alt={design.name}
                      className="w-full h-full object-cover"
                    />
                    {design.is_public && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {design.name}
                    </h3>
                    {design.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {design.description}
                      </p>
                    )}
                    {design.dimensions && (
                      <p className="text-xs text-gray-500 mt-2">
                        {design.dimensions.width} × {design.dimensions.height}px
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => window.open(design.image_url, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(design.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
