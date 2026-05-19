/**
 * VariantForm Component
 * 
 * Form for creating and editing variants
 * Requirements: 12.1-12.12 - Variant form specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select } from '@/src/components/ui/select';

// Model type
export interface Model {
  id: string;
  name: string;
  brand_id: string;
}

// Product type type
export interface ProductType {
  id: string;
  name: string;
}

// Variant type
export interface Variant {
  id: string;
  name: string;
  model_id: string;
  product_type_id: string;
  color_name: string;
  color_hex: string;
  price_modifier?: number;
  stock_quantity: number;
  image_url?: string;
  additional_image_urls?: string[];
  is_active: boolean;
  created_at: string;
}

// Form data type
interface VariantFormData {
  model_id: string;
  product_type_id: string;
  name: string;
  color_name: string;
  color_hex: string;
  price_modifier?: number;
  stock_quantity: number;
  image_url?: string;
  additional_image_urls?: string[];
  is_active: boolean;
}

export interface VariantFormProps {
  variant?: Variant | null;
  models: Model[];
  productTypes: ProductType[];
  onSave: (data: VariantFormData) => void;
  onCancel: () => void;
}

export function VariantForm({ variant, models, productTypes, onSave, onCancel }: VariantFormProps) {
  const [formData, setFormData] = useState<VariantFormData>({
    model_id: variant?.model_id || models[0]?.id || '',
    product_type_id: variant?.product_type_id || productTypes[0]?.id || '',
    name: variant?.name || '',
    color_name: variant?.color_name || '',
    color_hex: variant?.color_hex || '#000000',
    price_modifier: variant?.price_modifier || 0,
    stock_quantity: variant?.stock_quantity || 0,
    image_url: variant?.image_url || '',
    additional_image_urls: variant?.additional_image_urls || [],
    is_active: variant?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset selections if current values are not in lists
    if (!models.find(m => m.id === formData.model_id) && models.length > 0) {
      setFormData(prev => ({ ...prev, model_id: models[0].id }));
    }
    if (!productTypes.find(pt => pt.id === formData.product_type_id) && productTypes.length > 0) {
      setFormData(prev => ({ ...prev, product_type_id: productTypes[0].id }));
    }
  }, [models, productTypes]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.model_id) {
      newErrors.model_id = 'Phone model is required';
    }
    
    if (!formData.product_type_id) {
      newErrors.product_type_id = 'Product type is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Variant name is required';
    }
    
    if (!formData.color_name.trim()) {
      newErrors.color_name = 'Color name is required';
    }
    
    if (!formData.color_hex.trim()) {
      newErrors.color_hex = 'Color hex is required';
    }
    
    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity must be a non-negative number';
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
      console.error('Error saving variant:', error);
      alert('Failed to save variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof VariantFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Phone Model */}
      <div>
        <Label htmlFor="model_id" className="required">
          Phone Model
        </Label>
        <Select
          id="model_id"
          value={formData.model_id}
          onChange={(e) => handleChange('model_id', e.target.value)}
          className={errors.model_id ? 'border-red-500' : ''}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
        {errors.model_id && (
          <p className="mt-1 text-sm text-red-500">{errors.model_id}</p>
        )}
      </div>

      {/* Product Type */}
      <div>
        <Label htmlFor="product_type_id" className="required">
          Product Type
        </Label>
        <Select
          id="product_type_id"
          value={formData.product_type_id}
          onChange={(e) => handleChange('product_type_id', e.target.value)}
          className={errors.product_type_id ? 'border-red-500' : ''}
        >
          {productTypes.map((productType) => (
            <option key={productType.id} value={productType.id}>
              {productType.name}
            </option>
          ))}
        </Select>
        {errors.product_type_id && (
          <p className="mt-1 text-sm text-red-500">{errors.product_type_id}</p>
        )}
      </div>

      {/* Variant Name */}
      <div>
        <Label htmlFor="name" className="required">
          Variant Name
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter variant name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="color_name" className="required">
            Color Name
          </Label>
          <Input
            id="color_name"
            type="text"
            value={formData.color_name}
            onChange={(e) => handleChange('color_name', e.target.value)}
            placeholder="e.g., Midnight Black"
            className={errors.color_name ? 'border-red-500' : ''}
          />
          {errors.color_name && (
            <p className="mt-1 text-sm text-red-500">{errors.color_name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="color_hex" className="required">
            Color Hex
          </Label>
          <div className="flex items-center space-x-2">
            <input
              id="color_hex"
              type="color"
              value={formData.color_hex}
              onChange={(e) => handleChange('color_hex', e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
            <Input
              type="text"
              value={formData.color_hex}
              onChange={(e) => handleChange('color_hex', e.target.value)}
              placeholder="#000000"
              className={errors.color_hex ? 'border-red-500' : ''}
            />
          </div>
          {errors.color_hex && (
            <p className="mt-1 text-sm text-red-500">{errors.color_hex}</p>
          )}
        </div>
      </div>

      {/* Price Modifier */}
      <div>
        <Label htmlFor="price_modifier">
          Price Modifier
        </Label>
        <Input
          id="price_modifier"
          type="number"
          value={formData.price_modifier}
          onChange={(e) => handleChange('price_modifier', parseFloat(e.target.value) || 0)}
          step="0.01"
        />
      </div>

      {/* Stock Quantity */}
      <div>
        <Label htmlFor="stock_quantity" className="required">
          Stock Quantity
        </Label>
        <Input
          id="stock_quantity"
          type="number"
          value={formData.stock_quantity}
          onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
          min="0"
          className={errors.stock_quantity ? 'border-red-500' : ''}
        />
        {errors.stock_quantity && (
          <p className="mt-1 text-sm text-red-500">{errors.stock_quantity}</p>
        )}
      </div>

      {/* Main Image */}
      <div>
        <Label htmlFor="image_url">
          Main Image URL
        </Label>
        <Input
          id="image_url"
          type="text"
          value={formData.image_url}
          onChange={(e) => handleChange('image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Additional Images */}
      <div>
        <Label htmlFor="additional_image_urls">
          Additional Images (comma-separated URLs)
        </Label>
        <Input
          id="additional_image_urls"
          type="text"
          value={formData.additional_image_urls?.join(', ')}
          onChange={(e) => handleChange('additional_image_urls', e.target.value.split(',').map(s => s.trim()))}
          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
        />
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
          {isSubmitting ? 'Saving...' : (variant ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}