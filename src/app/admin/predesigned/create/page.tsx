/**
 * Create Predesigned Product Page
 * 
 * Form to create a new predesigned case (variant + design)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface ProductType {
  id: string;
  name: string;
  base_price: number;
}

interface Variant {
  id: string;
  sku: string;
  color_name: string;
  color_hex: string;
  price: number;
  stock_quantity: number;
  image_url: string;
}

interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  category: string;
  tags: string[];
}

export default function CreatePredesignedPage() {
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Selection state
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('');
  
  // Data state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [designs, setDesigns] = useState<DesignTemplate[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [designSearch, setDesignSearch] = useState('');

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
    fetchProductTypes();
    fetchDesigns();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchModels(selectedBrand);
      setSelectedModel('');
      setSelectedVariant('');
    }
  }, [selectedBrand]);

  // Fetch variants when model and product type change
  useEffect(() => {
    if (selectedModel && selectedProductType) {
      fetchVariants(selectedModel, selectedProductType);
      setSelectedVariant('');
    }
  }, [selectedModel, selectedProductType]);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchModels = async (brandId: string) => {
    try {
      const res = await fetch(`/api/models?brand_id=${brandId}`);
      const data = await res.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const res = await fetch('/api/product-types');
      const data = await res.json();
      setProductTypes(data.product_types || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const fetchVariants = async (modelId: string, productTypeId: string) => {
    try {
      const res = await fetch(`/api/variants?model_id=${modelId}&product_type_id=${productTypeId}`);
      const data = await res.json();
      setVariants(data.variants || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const fetchDesigns = async () => {
    try {
      const res = await fetch('/api/designs/templates');
      const data = await res.json();
      setDesigns(data.templates || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVariant || !selectedDesign) {
      setError('Please select both a variant and a design');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter a product name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/predesigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: selectedVariant,
          design_id: selectedDesign,
          name: name.trim(),
          description: description.trim() || null,
          price_override: priceOverride ? parseFloat(priceOverride) : null,
          is_featured: isFeatured,
          is_active: isActive,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create predesigned product');
      }
      
      router.push('/admin/predesigned');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const selectedDesignData = designs.find(d => d.id === selectedDesign);
  const filteredDesigns = designs.filter(d =>
    d.name.toLowerCase().includes(designSearch.toLowerCase()) ||
    d.category?.toLowerCase().includes(designSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Predesigned Product</h1>
              <p className="text-sm text-gray-600 mt-1">Combine a variant with a design template</p>
            </div>
            <Link href="/admin/predesigned">
              <Button variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Select Variant */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Case Variant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Brand */}
              <div>
                <Label htmlFor="brand">Brand</Label>
                <select
                  id="brand"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <Label htmlFor="model">Model</Label>
                <select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedBrand}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-transparent disabled:opacity-50"
                  required
                >
                  <option value="">Select Model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type */}
              <div>
                <Label htmlFor="productType">Case Type</Label>
                <select
                  id="productType"
                  value={selectedProductType}
                  onChange={(e) => setSelectedProductType(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                  required
                >
                  <option value="">Select Case Type</option>
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - ₹{type.base_price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant */}
              <div>
                <Label htmlFor="variant">Color Variant</Label>
                <select
                  id="variant"
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  disabled={!selectedModel || !selectedProductType}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-transparent disabled:opacity-50"
                  required
                >
                  <option value="">Select Color</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.color_name} - ₹{variant.price} (Stock: {variant.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Preview */}
              {selectedVariantData && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Selected Variant:</p>
                  <div className="flex items-center gap-4">
                    {selectedVariantData.image_url && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <Image
                          src={selectedVariantData.image_url}
                          alt={selectedVariantData.color_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{selectedVariantData.color_name}</p>
                      <p className="text-sm text-gray-600">₹{selectedVariantData.price}</p>
                      <p className="text-xs text-gray-500">SKU: {selectedVariantData.sku}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Design */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Design Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <Input
                placeholder="Search designs..."
                value={designSearch}
                onChange={(e) => setDesignSearch(e.target.value)}
                className="h-11"
              />

              {/* Design Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {filteredDesigns.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => setSelectedDesign(design.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedDesign === design.id
                        ? 'border-orange-600 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={design.thumbnail_url || design.image_url}
                      alt={design.name}
                      fill
                      className="object-cover"
                    />
                    {selectedDesign === design.id && (
                      <div className="absolute inset-0 bg-orange-600 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Design Info */}
              {selectedDesignData && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Selected Design:</p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={selectedDesignData.thumbnail_url || selectedDesignData.image_url}
                        alt={selectedDesignData.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedDesignData.name}</p>
                      <p className="text-sm text-gray-600">{selectedDesignData.category}</p>
                      {selectedDesignData.description && (
                        <p className="text-xs text-gray-500 mt-1">{selectedDesignData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sunset Gradient iPhone 15 Pro Case"
                  className="h-11"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this predesigned case..."
                  rows={3}
                />
              </div>

              {/* Price Override */}
              <div>
                <Label htmlFor="priceOverride">Price Override (Optional)</Label>
                <Input
                  id="priceOverride"
                  type="number"
                  step="0.01"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder={selectedVariantData ? `Default: ₹${selectedVariantData.price}` : 'Leave empty to use variant price'}
                  className="h-11"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Set a custom price for this predesigned product
                </p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">⭐ Featured (show on homepage)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">✓ Active (available for purchase)</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/admin/predesigned" className="flex-1">
              <Button type="button" variant="outline" className="w-full h-12">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !selectedVariant || !selectedDesign}
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                '✓ Create Predesigned Product'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
