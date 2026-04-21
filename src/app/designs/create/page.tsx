/**
 * Design Creation Page
 * 
 * Upload custom designs for phone cases
 * Requirements: 7.1, 7.2 - Design upload and management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainNav } from '@/src/components/navigation/MainNav';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Upload, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateDesignPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/cart'); // Quick auth check
        if (res.status === 401) {
          setIsAuthenticated(false);
          router.push('/auth/login?redirectTo=/designs/create');
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
        router.push('/auth/login?redirectTo=/designs/create');
      }
    };
    checkAuth();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a design name');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Upload image first
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('type', 'design');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        // Handle authentication error
        if (uploadRes.status === 401) {
          setError('Please log in to upload designs');
          setTimeout(() => {
            router.push('/auth/login?redirectTo=/designs/create');
          }, 2000);
          return;
        }
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      // Create design record
      const designRes = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          image_url: uploadData.url,
          is_public: false,
        }),
      });

      const designData = await designRes.json();

      if (!designRes.ok) {
        throw new Error(designData.error || 'Failed to create design');
      }

      setSuccess('Design uploaded successfully!');
      
      // Redirect to designs page after 1 second
      setTimeout(() => {
        router.push('/dashboard/designs');
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload design');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <MainNav />

      {isAuthenticated === null ? (
        <main className="px-4 py-8 sm:px-6 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔐</div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </main>
      ) : (
        <main className="px-4 py-8 sm:px-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/dashboard/designs"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Designs
        </Link>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Upload Custom Design</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Upload your own design to create a custom phone case
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold">
                  Design Image *
                </Label>
                
                {!imagePreview ? (
                  <label
                    htmlFor="image"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-gray-50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, or JPEG (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Design Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Design Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., My Custom Design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={uploading}
                  required
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for your design..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Guidelines */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-orange-900 mb-2">
                  Design Guidelines
                </h4>
                <ul className="text-xs text-orange-800 space-y-1">
                  <li>• Use high-resolution images (at least 1000x1000px)</li>
                  <li>• Ensure your design fits within the printable area</li>
                  <li>• Avoid copyrighted or trademarked content</li>
                  <li>• Supported formats: PNG, JPG, JPEG</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={uploading || !imageFile}
                  className="flex-1 h-12"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload Design
                    </>
                  )}
                </Button>
                
                <Link href="/dashboard/designs" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full h-12"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      )}
    </div>
  );
}
