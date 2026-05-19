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
  created_at: string;
}

// Form data type
interface ModelFormData {
  brand_id: string;
  name: string;
  release_year?: number;
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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