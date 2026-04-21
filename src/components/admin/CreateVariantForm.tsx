/**
 * Create Variant Form Component
 * 
 * Mobile-first form for creating individual product variants with color picker
 * Requirements: 2.4, 2.5 - Variant management and pricing
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectOption } from '@/src/components/ui/select';
import { ProductType, PhoneModel, Brand, COLORS } from '@/types/products';

interface CreateVariantFormProps {
  onSuccess?: () => void;
}

export function CreateVariantForm({ onSuccess }: CreateVariantFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredModels, setFilteredModels] = useState<PhoneModel[]>([]);

  const [formData, setFormData] = useState({
    brand_id: '',
    model_id: '',
    product_type_id: '',
    color_name: '',
    color_hex: '#000000',
    price_modifier: '0',
    stock_quantity: '0',
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
      
      // Reset model selection if current model is not in filtered list
      if (formData.model_id && !filtered.find(m => m.id === formData.model_id)) {
        setFormData(prev => ({ ...prev, model_id: '' }));
      }
    } else {
      setFilteredModels([]);
      setFormData(prev => ({ ...prev, model_id: '' }));
    }
  }, [formData.brand_id, models]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: formData.model_id,
          product_type_id: formData.product_type_id,
          color_name: formData.color_name,
          color_hex: formData.color_hex,
          price_modifier: parseFloat(formData.price_modifier),
          stock_quantity: parseInt(formData.stock_quantity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create variant');
      }

      setSuccess(`Variant "${formData.color_name}" created successfully!`);
      
      // Reset form
      setFormData({
        brand_id: '',
        model_id: '',
        product_type_id: '',
        color_name: '',
        color_hex: '#000000',
        price_modifier: '0',
        stock_quantity: '0',
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredefinedColor = (colorName: string, colorHex: string) => {
    setFormData(prev => ({
      ...prev,
      color_name: colorName,
      color_hex: colorHex,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Device Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Device Selection</h3>
        
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
            <Label htmlFor="model_id">Model *</Label>
            <Select
              id="model_id"
              value={formData.model_id}
              onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
              required
              disabled={!formData.brand_id}
            >
              <SelectOption value="">Select a model</SelectOption>
              {filteredModels.map((model) => (
                <SelectOption key={model.id} value={model.id}>
                  {model.name}
                </SelectOption>
              ))}
            </Select>
          </div>
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

      {/* Color Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Color Configuration</h3>
        
        {/* Predefined Colors */}
        <div className="space-y-2">
          <Label>Quick Color Selection</Label>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {Object.entries(COLORS).map(([key, color]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePredefinedColor(color.name, color.hex)}
                className={`relative h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                  formData.color_name === color.name 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 hover:bg-opacity-10 transition-all"></div>
                <div className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black bg-opacity-50 rounded-b-lg px-1 py-0.5 truncate">
                  {color.name}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color_name">Color Name *</Label>
            <Input
              id="color_name"
              type="text"
              placeholder="e.g., Midnight Blue"
              value={formData.color_name}
              onChange={(e) => setFormData(prev => ({ ...prev, color_name: e.target.value }))}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="color_hex">Color Code</Label>
            <div className="flex space-x-2">
              <Input
                id="color_hex"
                type="color"
                value={formData.color_hex}
                onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                className="h-11 w-16 p-1"
              />
              <Input
                type="text"
                placeholder="#000000"
                value={formData.color_hex}
                onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                className="h-11 flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing and Inventory */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pricing & Inventory</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_modifier">Price Modifier ($)</Label>
            <Input
              id="price_modifier"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price_modifier}
              onChange={(e) => setFormData(prev => ({ ...prev, price_modifier: e.target.value }))}
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              Additional cost added to base product type price
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Initial Stock Quantity</Label>
            <Input
              id="stock_quantity"
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
              className="h-11"
            />
          </div>
        </div>
      </div>

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
          disabled={isLoading || !formData.model_id || !formData.product_type_id || !formData.color_name}
          className="h-11 px-8"
        >
          {isLoading ? 'Creating...' : 'Create Variant'}
        </Button>
      </div>
    </form>
  );
}