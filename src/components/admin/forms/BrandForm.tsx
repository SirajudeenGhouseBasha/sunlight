/**
 * BrandForm Component
 * 
 * Form for creating and editing brands
 * Requirements: 8.1-8.12 - Brand form specifications
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';

// Brand type
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  created_at: string;
}

// Form data type
interface BrandFormData {
  name: string;
  logo_url?: string;
  description?: string;
}

export interface BrandFormProps {
  brand?: Brand | null;
  onSave: (data: BrandFormData) => void;
  onCancel: () => void;
}

export function BrandForm({ brand, onSave, onCancel }: BrandFormProps) {
  const [formData, setFormData] = useState<BrandFormData>({
    name: brand?.name || '',
    logo_url: brand?.logo_url || '',
    description: brand?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required';
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
      console.error('Error saving brand:', error);
      alert('Failed to save brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof BrandFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand Name */}
      <div>
        <Label htmlFor="name" className="required">
          Brand Name
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter brand name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Logo URL */}
      <div>
        <Label htmlFor="logo_url">
          Logo URL
        </Label>
        <Input
          id="logo_url"
          type="text"
          value={formData.logo_url}
          onChange={(e) => handleChange('logo_url', e.target.value)}
          placeholder="https://example.com/logo.png"
        />
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
          placeholder="Enter brand description"
          rows={3}
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
          {isSubmitting ? 'Saving...' : (brand ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}