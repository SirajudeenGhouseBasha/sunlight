/**
 * ModelForm Component
 * 
 * Form for creating and editing models
 * Requirements: 10.1-10.8 - Model form specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select } from '@/src/components/ui/select';

// Brand type
export interface Brand {
  id: string;
  name: string;
  slug: string;
}

// Model type
export interface Model {
  id: string;
  name: string;
  brand_id: string;
  release_year?: number;
  mockup_template_url?: string;
  mockup_constraints?: any;
  created_at: string;
}

// Form data type
interface ModelFormData {
  brand_id: string;
  name: string;
  release_year?: number;
  mockup_template_url?: string;
  mockup_constraints?: any;
}

export interface ModelFormProps {
  model?: Model | null;
  brands: Brand[];
  onSave: (data: ModelFormData) => void;
  onCancel: () => void;
}

export function ModelForm({ model, brands, onSave, onCancel }: ModelFormProps) {
  const [formData, setFormData] = useState<ModelFormData>({
    brand_id: model?.brand_id || brands[0]?.id || '',
    name: model?.name || '',
    release_year: model?.release_year || new Date().getFullYear(),
    mockup_template_url: model?.mockup_template_url || '',
    mockup_constraints: model?.mockup_constraints || null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(model?.mockup_template_url || null);

  useEffect(() => {
    // Reset brand_id if current selection is not in brands list
    if (!brands.find(b => b.id === formData.brand_id) && brands.length > 0) {
      setFormData(prev => ({ ...prev, brand_id: brands[0].id }));
    }
  }, [brands]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.brand_id) {
      newErrors.brand_id = 'Brand is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Model name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(formData);
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Failed to save model');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ModelFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, mockup_template: 'Please upload a valid image file (JPEG, PNG, WebP, or SVG)' }));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, mockup_template: 'Image size must be less than 10MB' }));
      return;
    }

    setUploadingImage(true);
    setErrors(prev => ({ ...prev, mockup_template: '' }));

    try {
      // Create form data for upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('bucket', 'mockup-templates');

      // Upload to Supabase storage
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({ 
        ...prev, 
        mockup_template_url: data.url,
        mockup_constraints: prev.mockup_constraints || {
          canvas_dimensions: { width: 1000, height: 2000 },
          print_area: { x: 100, y: 200, width: 800, height: 1600 },
          safe_area: { x: 150, y: 250, width: 700, height: 1500 },
          constraints: {
            max_layers: 10,
            max_text_elements: 5,
            max_image_elements: 5,
            allowed_fonts: ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Impact', 'Comic Sans MS'],
            min_font_size: 12,
            max_font_size: 144,
            max_image_size_mb: 10,
            allowed_image_formats: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
          }
        }
      }));
      
      // Set preview
      setImagePreview(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({ ...prev, mockup_template: 'Failed to upload image. Please try again.' }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, mockup_template_url: '' }));
    setImagePreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand */}
      <div>
        <Label htmlFor="brand_id" className="required">
          Brand
        </Label>
        <Select
          id="brand_id"
          value={formData.brand_id}
          onChange={(e) => handleChange('brand_id', e.target.value)}
          className={errors.brand_id ? 'border-red-500' : ''}
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
        {errors.brand_id && (
          <p className="mt-1 text-sm text-red-500">{errors.brand_id}</p>
        )}
      </div>

      {/* Model Name */}
      <div>
        <Label htmlFor="name" className="required">
          Model Name
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter model name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Release Year */}
      <div>
        <Label htmlFor="release_year">
          Release Year
        </Label>
        <Input
          id="release_year"
          type="number"
          value={formData.release_year}
          onChange={(e) => handleChange('release_year', parseInt(e.target.value) || new Date().getFullYear())}
          min="1900"
          max="2100"
        />
      </div>

      {/* Mockup Template Image Upload */}
      <div>
        <Label htmlFor="mockup_template">
          Mockup Template Image
        </Label>
        <p className="text-sm text-gray-500 mb-2">
          Upload a mockup template image for custom phone case designs. This will be used for all material types.
        </p>
        
        {imagePreview ? (
          <div className="space-y-2">
            <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <img 
                src={imagePreview} 
                alt="Mockup template preview" 
                className="w-full h-full object-contain"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveImage}
              className="w-full"
            >
              Remove Image
            </Button>
          </div>
        ) : (
          <div className="relative">
            <input
              id="mockup_template"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {uploadingImage && (
              <p className="mt-2 text-sm text-blue-600">Uploading image...</p>
            )}
          </div>
        )}
        
        {errors.mockup_template && (
          <p className="mt-1 text-sm text-red-500">{errors.mockup_template}</p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (model ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}