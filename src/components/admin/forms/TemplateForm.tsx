/**
 * TemplateForm Component
 * 
 * Form for creating and editing templates
 * Requirements: 18.1-18.7 - Template form specifications
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';

// Template type
export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail_url?: string;
  is_featured: boolean;
  created_at: string;
}

// Form data type
interface TemplateFormData {
  name: string;
  category: string;
  thumbnail_url?: string;
  is_featured: boolean;
}

export interface TemplateFormProps {
  template?: Template | null;
  onSave: (data: TemplateFormData) => void;
  onCancel: () => void;
}

export function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: template?.name || '',
    category: template?.category || '',
    thumbnail_url: template?.thumbnail_url || '',
    is_featured: template?.is_featured ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
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
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TemplateFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <Label htmlFor="name" className="required">
          Name
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter template name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category" className="required">
          Category
        </Label>
        <Input
          id="category"
          type="text"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          placeholder="e.g., Abstract, Nature, Minimal"
          className={errors.category ? 'border-red-500' : ''}
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category}</p>
        )}
      </div>

      {/* Thumbnail */}
      <div>
        <Label htmlFor="thumbnail_url">
          Thumbnail URL
        </Label>
        <Input
          id="thumbnail_url"
          type="text"
          value={formData.thumbnail_url}
          onChange={(e) => handleChange('thumbnail_url', e.target.value)}
          placeholder="https://example.com/thumbnail.jpg"
        />
        {formData.thumbnail_url && (
          <div className="mt-2">
            <img
              src={formData.thumbnail_url}
              alt="Thumbnail preview"
              className="h-24 w-auto rounded object-cover"
            />
          </div>
        )}
      </div>

      {/* Featured */}
      <div>
        <Label htmlFor="is_featured">Featured</Label>
        <div className="flex items-center space-x-2 mt-2">
          <button
            type="button"
            onClick={() => handleChange('is_featured', true)}
            className={`px-3 py-1 rounded text-sm ${
              formData.is_featured 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleChange('is_featured', false)}
            className={`px-3 py-1 rounded text-sm ${
              !formData.is_featured 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            No
          </button>
        </div>
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
          {isSubmitting ? 'Saving...' : (template ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}