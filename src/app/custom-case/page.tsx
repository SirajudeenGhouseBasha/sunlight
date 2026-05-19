/**
 * Custom Case - Brand & Model Selection Page
 *
 * Step 1 of the custom case flow: user selects a brand, then a model.
 * On confirmation navigates to product-type selection.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/src/components/navigation/MainNav';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Select, SelectOption } from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { ArrowRight, ArrowLeft, Smartphone, Paintbrush } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

import { useBrandsAndModels } from '@/src/hooks/useBrandsAndModels';

export default function CustomCaseSelectionPage() {
  const router = useRouter();

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const { brands, filteredModels, loading, error } = useBrandsAndModels(selectedBrand);

  const handleNext = () => {
    if (!selectedModel) return;
    router.push(`/custom-case/type?modelId=${selectedModel}`);
  };

  const selectedBrandData = brands.find((b) => b.id === selectedBrand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <MainNav />

      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 text-white py-12 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Paintbrush className="w-4 h-4" />
            Custom Design Studio
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            Design Your Custom Case
          </h1>
          <p className="text-lg text-orange-100 max-w-xl mx-auto">
            Choose your device and create a one-of-a-kind phone case with your own images and text.
          </p>
        </div>
      </section>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span className="flex items-center gap-1.5 text-orange-600 font-semibold">
            <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">1</span>
            Select Device
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">2</span>
            Choose Case Type
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">3</span>
            Customize
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading devices…
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select Your Device</h2>
                  <p className="text-sm text-gray-500">Pick the brand and model of your phone</p>
                </div>
              </div>

              {/* Brand dropdown */}
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  id="brand"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  <SelectOption value="">Select a brand</SelectOption>
                  {brands.map((brand) => (
                    <SelectOption key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              {/* Model dropdown */}
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedBrand}
                >
                  <SelectOption value="">
                    {selectedBrand ? 'Select a model' : 'Select a brand first'}
                  </SelectOption>
                  {filteredModels.map((model) => (
                    <SelectOption key={model.id} value={model.id}>
                      {model.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              {/* Selection summary */}
              {selectedBrandData && selectedModel && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                    📱
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedBrandData.name}{' '}
                      {filteredModels.find((m) => m.id === selectedModel)?.name}
                    </p>
                    <p className="text-sm text-gray-600">Ready to pick a case type</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Link href="/">
                  <Button variant="outline" className="h-11 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </Link>

                <Button
                  onClick={handleNext}
                  disabled={!selectedModel}
                  className="h-11 px-8 gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  Next: Choose Case Type
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
