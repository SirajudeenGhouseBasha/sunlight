/**
 * Bulk Variant Creator Component
 * 
 * Mobile-first interface for creating variants for multiple models at once
 * Requirements: 2.4, 2.5 - Variant management and pricing
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Select, SelectOption } from '@/src/components/ui/select';
import { Card, CardContent } from '@/src/components/ui/card';
import { ProductType, PhoneModel, Brand, COLORS } from '@/src/types/products';

interface BulkVariantCreatorProps {
  onSuccess?: () => void;
}

export function BulkVariantCreator({ onSuccess }: BulkVariantCreatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredModels, setFilteredModels] = useState<PhoneModel[]>([]);

  const [formData, setFormData] = useState({
    brand_id: '',
    selected_model_ids: [] as string[],
    product_type_id: '',
    selected_colors: [] as string[],
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, modelsRes, productTypesRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/models'),
          fetch('/api/product-types?active=true'),
        ]);

        const [brandsData, modelsData, productTypesData] = await Promise.all([
          brandsRes.json(),
          modelsRes.json(),
          productTypesRes.json(),
        ]);

        setBrands(brandsData.brands || []);
        setModels(modelsData.models || []);
        setProductTypes(productTypesData.product_types || []);
      } catch (err) {
        setError('Failed to load form data');
      }
    };

    fetchData();
  }, []);

  // Filter models by selected brand
  useEffect(() => {
    if (formData.brand_id) {
      const filtered = models.filter(model => model.brand_id === formData.brand_id);
      setFilteredModels(filtered);
      
      // Reset model selection if current models are not in filtered list
      const validModelIds = filtered.map(m => m.id);
      const filteredSelectedIds = formData.selected_model_ids.filter(id => validModelIds.includes(id));
      
      if (filteredSelectedIds.length !== formData.selected_model_ids.length) {
        setFormData(prev => ({ ...prev, selected_model_ids: filteredSelectedIds }));
      }
    } else {
      setFilteredModels([]);
      setFormData(prev => ({ ...prev, selected_model_ids: [] }));
    }
  }, [formData.brand_id, models]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare variants data from selected colors
      const variantsData = formData.selected_colors.map(colorKey => {
        const color = COLORS[colorKey as keyof typeof COLORS];
        return {
          color_name: color.name,
          color_hex: color.hex,
          price_modifier: 0,
          stock_quantity: 0,
        };
      });

      const response = await fetch('/api/variants', {
        method: 'PUT', // Using PUT for bulk operations
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_ids: formData.selected_model_ids,
          product_type_id: formData.product_type_id,
          variants_data: variantsData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create bulk variants');
      }

      const totalVariants = formData.selected_model_ids.length * formData.selected_colors.length;
      setSuccess(`Successfully created ${totalVariants} variants for ${formData.selected_model_ids.length} models!`);
      
      // Reset form
      setFormData({
        brand_id: '',
        selected_model_ids: [],
        product_type_id: '',
        selected_colors: [],
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_model_ids: prev.selected_model_ids.includes(modelId)
        ? prev.selected_model_ids.filter(id => id !== modelId)
        : [...prev.selected_model_ids, modelId]
    }));
  };

  const toggleColorSelection = (colorKey: string) => {
    setFormData(prev => ({
      ...prev,
      selected_colors: prev.selected_colors.includes(colorKey)
        ? prev.selected_colors.filter(key => key !== colorKey)
        : [...prev.selected_colors, colorKey]
    }));
  };

  const selectAllModels = () => {
    setFormData(prev => ({
      ...prev,
      selected_model_ids: filteredModels.map(m => m.id)
    }));
  };

  const selectPopularColors = () => {
    const popularColors = Object.entries(COLORS)
      .filter(([_, color]) => color.is_popular)
      .map(([key, _]) => key);
    
    setFormData(prev => ({
      ...prev,
      selected_colors: popularColors
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand and Product Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand_id">Brand *</Label>
          <Select
            id="brand_id"
            value={formData.brand_id}
            onChange={(e) => setFormData(prev => ({ ...prev, brand_id: e.target.value }))}
            required
          >
            <SelectOption value="">Select a brand</SelectOption>
            {brands.map((brand) => (
              <SelectOption key={brand.id} value={brand.id}>
                {brand.name}
              </SelectOption>
            ))}
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product_type_id">Product Type *</Label>
          <Select
            id="product_type_id"
            value={formData.product_type_id}
            onChange={(e) => setFormData(prev => ({ ...prev, product_type_id: e.target.value }))}
            required
          >
            <SelectOption value="">Select a product type</SelectOption>
            {productTypes.map((type) => (
              <SelectOption key={type.id} value={type.id}>
                {type.name} (${type.base_price.toFixed(2)})
              </SelectOption>
            ))}
          </Select>
        </div>
      </div>

      {/* Model Selection */}
      {formData.brand_id && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Select Models ({formData.selected_model_ids.length} selected)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllModels}
              disabled={filteredModels.length === 0}
            >
              Select All
            </Button>
          </div>
          
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredModels.map((model) => (
                <Card
                  key={model.id}
                  className={`cursor-pointer transition-all ${
                    formData.selected_model_ids.includes(model.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleModelSelection(model.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.selected_model_ids.includes(model.id)}
                        onChange={() => toggleModelSelection(model.id)}
                        className="rounded"
                      />
                      <div className="text-sm font-medium">{model.name}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Selection */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Select Colors ({formData.selected_colors.length} selected)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectPopularColors}
          >
            Select Popular
          </Button>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {Object.entries(COLORS).map(([key, color]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleColorSelection(key)}
              className={`relative h-16 rounded-lg border-2 transition-all hover:scale-105 ${
                formData.selected_colors.includes(key)
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {formData.selected_colors.includes(key) && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black bg-opacity-50 rounded-b-lg px-1 py-0.5 truncate">
                {color.name}
              </div>
              {color.is_popular && (
                <div className="absolute top-1 left-1 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  ★
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {formData.selected_model_ids.length > 0 && formData.selected_colors.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Bulk Creation Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• {formData.selected_model_ids.length} models selected</p>
            <p>• {formData.selected_colors.length} colors selected</p>
            <p className="font-medium">
              • Total variants to create: {formData.selected_model_ids.length * formData.selected_colors.length}
            </p>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            isLoading || 
            formData.selected_model_ids.length === 0 || 
            formData.selected_colors.length === 0 || 
            !formData.product_type_id
          }
          className="h-11 px-8"
        >
          {isLoading ? 'Creating...' : `Create ${formData.selected_model_ids.length * formData.selected_colors.length} Variants`}
        </Button>
      </div>
    </form>
  );
}