/**
 * PredesignedForm Component
 * 
 * Form for creating and editing predesigned cases
 * Requirements: 20.1-20.8 - Predesigned form specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select } from '@/src/components/ui/select';

// Variant type
export interface Variant {
  id: string;
  name: string;
}

// Design type
export interface Design {
  id: string;
  name: string;
}

// Predesigned type
export interface Predesigned {
  id: string;
  name: string;
  description?: string;
  price_override?: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  variant_id?: string;
  design_id?: string;
}

// Form data type
interface PredesignedFormData {
  variant_id: string;
  design_id: string;
  name: string;
  description?: string;
  price_override?: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface PredesignedFormProps {
  predesigned?: Predesigned | null;
  variants: Variant[];
  designs: Design[];
  onSave: (data: PredesignedFormData) => void;
  onCancel: () => void;
}

export function PredesignedForm({ predesigned, variants, designs, onSave, onCancel }: PredesignedFormProps) {
  const [formData, setFormData] = useState<PredesignedFormData>({
    variant_id: predesigned?.variant_id || variants[0]?.id || '',
    design_id: predesigned?.design_id || designs[0]?.id || '',
    name: predesigned?.name || '',
    description: predesigned?.description || '',
    price_override: predesigned?.price_override || undefined,
    is_featured: predesigned?.is_featured ?? false,
    is_active: predesigned?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset selections if current values are not in lists
    if (!variants.find(v => v.id === formData.variant_id) && variants.length > 0) {
      setFormData(prev => ({ ...prev, variant_id: variants[0].id }));
    }
    if (!designs.find(d => d.id === formData.design_id) && designs.length > 0) {
      setFormData(prev => ({ ...prev, design_id: designs[0].id }));
    }
  }, [variants, designs]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.variant_id) {
      newErrors.variant_id = 'Variant is required';
    }
    
    if (!formData.design_id) {
      newErrors.design_id = 'Design is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.price_override !== undefined && formData.price_override < 0) {
      newErrors.price_override = 'Price must be a non-negative number';
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
      console.error('Error saving predesigned:', error);
      alert('Failed to save predesigned');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof PredesignedFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Variant */}
      <div>
        <Label htmlFor="variant_id" className="required">
          Variant
        </Label>
        <Select
          id="variant_id"
          value={formData.variant_id}
          onChange={(e) => handleChange('variant_id', e.target.value)}
          className={errors.variant_id ? 'border-red-500' : ''}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </Select>
        {errors.variant_id && (
          <p className="mt-1 text-sm text-red-500">{errors.variant_id}</p>
        )}
      </div>

      {/* Design */}
      <div>
        <Label htmlFor="design_id" className="required">
          Design
        </Label>
        <Select
          id="design_id"
          value={formData.design_id}
          onChange={(e) => handleChange('design_id', e.target.value)}
          className={errors.design_id ? 'border-red-500' : ''}
        >
          {designs.map((design) => (
            <option key={design.id} value={design.id}>
              {design.name}
            </option>
          ))}
        </Select>
        {errors.design_id && (
          <p className="mt-1 text-sm text-red-500">{errors.design_id}</p>
        )}
      </div>

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
          placeholder="Enter predesigned name"
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
          placeholder="Enter predesigned description"
          rows={3}
        />
      </div>

      {/* Price Override */}
      <div>
        <Label htmlFor="price_override">
          Price Override (optional)
        </Label>
        <Input
          id="price_override"
          type="number"
          value={formData.price_override || ''}
          onChange={(e) => handleChange('price_override', e.target.value ? parseFloat(e.target.value) : undefined)}
          min="0"
          step="0.01"
          placeholder="Leave empty to use variant price"
          className={errors.price_override ? 'border-red-500' : ''}
        />
        {errors.price_override && (
          <p className="mt-1 text-sm text-red-500">{errors.price_override}</p>
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
          {isSubmitting ? 'Saving...' : (predesigned ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}