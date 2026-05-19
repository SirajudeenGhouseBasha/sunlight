/**
 * ProductTypeForm Component
 * 
 * Form for creating and editing product types
 * Requirements: 14.1-14.7 - Product type form specifications
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';

// Product type type
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

// Form data type
interface ProductTypeFormData {
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
}

export interface ProductTypeFormProps {
  productType?: ProductType | null;
  onSave: (data: ProductTypeFormData) => void;
  onCancel: () => void;
}

export function ProductTypeForm({ productType, onSave, onCancel }: ProductTypeFormProps) {
  const [formData, setFormData] = useState<ProductTypeFormData>({
    name: productType?.name || '',
    description: productType?.description || '',
    base_price: productType?.base_price || 0,
    is_active: productType?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product type name is required';
    }
    
    if (formData.base_price < 0) {
      newErrors.base_price = 'Base price must be a positive number';
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
      console.error('Error saving product type:', error);
      alert('Failed to save product type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProductTypeFormData, value: string | number | boolean) => {
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
          placeholder="Enter product type name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter product type description"
          rows={3}
        />
      </div>

      {/* Base Price */}
      <div>
        <Label htmlFor="base_price" className="required">
          Base Price
        </Label>
        <Input
          id="base_price"
          type="number"
          value={formData.base_price}
          onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          className={errors.base_price ? 'border-red-500' : ''}
        />
        {errors.base_price && (
          <p className="mt-1 text-sm text-red-500">{errors.base_price}</p>
        )}
      </div>

      {/* Active Status */}
      <div>
        <Label htmlFor="is_active">Active Status</Label>
        <div className="flex items-center space-x-2 mt-2">
          <button
            type="button"
            onClick={() => handleChange('is_active', true)}
            className={`px-3 py-1 rounded text-sm ${
              formData.is_active 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => handleChange('is_active', false)}
            className={`px-3 py-1 rounded text-sm ${
              !formData.is_active 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Inactive
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
          {isSubmitting ? 'Saving...' : (productType ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}