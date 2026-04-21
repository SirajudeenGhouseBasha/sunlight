/**
 * Create Product Type Form Component
 * 
 * Mobile-first form for creating new product types
 * Requirements: 2.2 - Product type management
 */

'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectOption } from '@/src/components/ui/select';
import { MaterialProperties } from '@/types/products';

interface CreateProductTypeFormProps {
  onSuccess?: () => void;
}

export function CreateProductTypeForm({ onSuccess }: CreateProductTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    material_properties: {
      durability: 'medium' as MaterialProperties['durability'],
      flexibility: 'semi-flexible' as MaterialProperties['flexibility'],
      transparency: 'opaque' as MaterialProperties['transparency'],
      texture: 'smooth' as MaterialProperties['texture'],
      protection_level: 'standard' as MaterialProperties['protection_level'],
      weight: 'medium' as MaterialProperties['weight'],
      grip: 'medium' as MaterialProperties['grip'],
      scratch_resistance: 'medium' as MaterialProperties['scratch_resistance'],
      drop_protection: 'standard' as MaterialProperties['drop_protection'],
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/product-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          material_properties: formData.material_properties,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product type');
      }

      setSuccess(`Product type "${formData.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        base_price: '',
        material_properties: {
          durability: 'medium',
          flexibility: 'semi-flexible',
          transparency: 'opaque',
          texture: 'smooth',
          protection_level: 'standard',
          weight: 'medium',
          grip: 'medium',
          scratch_resistance: 'medium',
          drop_protection: 'standard',
        }
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMaterialProperty = (key: keyof MaterialProperties, value: string) => {
    setFormData(prev => ({
      ...prev,
      material_properties: {
        ...prev.material_properties,
        [key]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Type Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Premium Silicone"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price ($) *</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="15.99"
              value={formData.base_price}
              onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
              required
              className="h-11"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the material properties and benefits..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>
      </div>

      {/* Material Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Material Properties</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="durability">Durability</Label>
            <Select
              id="durability"
              value={formData.material_properties.durability}
              onChange={(e) => updateMaterialProperty('durability', e.target.value as MaterialProperties['durability'])}
            >
              <SelectOption value="low">Low</SelectOption>
              <SelectOption value="medium">Medium</SelectOption>
              <SelectOption value="high">High</SelectOption>
              <SelectOption value="premium">Premium</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="flexibility">Flexibility</Label>
            <Select
              id="flexibility"
              value={formData.material_properties.flexibility}
              onChange={(e) => updateMaterialProperty('flexibility', e.target.value as MaterialProperties['flexibility'])}
            >
              <SelectOption value="rigid">Rigid</SelectOption>
              <SelectOption value="semi-flexible">Semi-Flexible</SelectOption>
              <SelectOption value="flexible">Flexible</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transparency">Transparency</Label>
            <Select
              id="transparency"
              value={formData.material_properties.transparency}
              onChange={(e) => updateMaterialProperty('transparency', e.target.value as MaterialProperties['transparency'])}
            >
              <SelectOption value="opaque">Opaque</SelectOption>
              <SelectOption value="translucent">Translucent</SelectOption>
              <SelectOption value="transparent">Transparent</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="texture">Texture</Label>
            <Select
              id="texture"
              value={formData.material_properties.texture}
              onChange={(e) => updateMaterialProperty('texture', e.target.value as MaterialProperties['texture'])}
            >
              <SelectOption value="smooth">Smooth</SelectOption>
              <SelectOption value="textured">Textured</SelectOption>
              <SelectOption value="matte">Matte</SelectOption>
              <SelectOption value="glossy">Glossy</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="protection_level">Protection Level</Label>
            <Select
              id="protection_level"
              value={formData.material_properties.protection_level}
              onChange={(e) => updateMaterialProperty('protection_level', e.target.value as MaterialProperties['protection_level'])}
            >
              <SelectOption value="basic">Basic</SelectOption>
              <SelectOption value="standard">Standard</SelectOption>
              <SelectOption value="enhanced">Enhanced</SelectOption>
              <SelectOption value="maximum">Maximum</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <Select
              id="weight"
              value={formData.material_properties.weight}
              onChange={(e) => updateMaterialProperty('weight', e.target.value as MaterialProperties['weight'])}
            >
              <SelectOption value="light">Light</SelectOption>
              <SelectOption value="medium">Medium</SelectOption>
              <SelectOption value="heavy">Heavy</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="grip">Grip</Label>
            <Select
              id="grip"
              value={formData.material_properties.grip}
              onChange={(e) => updateMaterialProperty('grip', e.target.value as MaterialProperties['grip'])}
            >
              <SelectOption value="low">Low</SelectOption>
              <SelectOption value="medium">Medium</SelectOption>
              <SelectOption value="high">High</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scratch_resistance">Scratch Resistance</Label>
            <Select
              id="scratch_resistance"
              value={formData.material_properties.scratch_resistance}
              onChange={(e) => updateMaterialProperty('scratch_resistance', e.target.value as MaterialProperties['scratch_resistance'])}
            >
              <SelectOption value="low">Low</SelectOption>
              <SelectOption value="medium">Medium</SelectOption>
              <SelectOption value="high">High</SelectOption>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="drop_protection">Drop Protection</Label>
            <Select
              id="drop_protection"
              value={formData.material_properties.drop_protection}
              onChange={(e) => updateMaterialProperty('drop_protection', e.target.value as MaterialProperties['drop_protection'])}
            >
              <SelectOption value="basic">Basic</SelectOption>
              <SelectOption value="standard">Standard</SelectOption>
              <SelectOption value="military_grade">Military Grade</SelectOption>
            </Select>
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
          disabled={isLoading || !formData.name || !formData.base_price}
          className="h-11 px-8"
        >
          {isLoading ? 'Creating...' : 'Create Product Type'}
        </Button>
      </div>
    </form>
  );
}