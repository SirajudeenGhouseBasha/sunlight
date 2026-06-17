'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/src/components/navigation/MainNav';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Select, SelectOption } from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { ArrowRight, ArrowLeft, Smartphone, Paintbrush, ChevronRight, Check } from 'lucide-react';
import { useBrandsAndModels } from '@/src/hooks/useBrandsAndModels';

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
  const selectedModelData = filteredModels.find((m) => m.id === selectedModel);
  const canProceed = !!selectedBrand && !!selectedModel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <MainNav />

      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white py-10 sm:py-14 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Paintbrush className="w-4 h-4" />
            Custom Design Studio
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Design Your Custom Case
          </h1>
          <p className="text-sm sm:text-lg text-orange-100 max-w-xl mx-auto">
            Choose your device and create a one-of-a-kind phone case with your own images and text.
          </p>
        </div>
      </section>

      {/* Step indicator - Mobile optimized */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
          <span className="flex items-center gap-1 text-orange-600 font-semibold">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold">1</span>
            <span className="hidden sm:inline">Select Device</span>
            <span className="sm:hidden">Device</span>
          </span>
          <div className="flex-1 h-px bg-orange-200 mx-1" />
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] sm:text-xs font-bold">2</span>
            <span className="hidden sm:inline">Choose Case Type</span>
            <span className="sm:hidden">Type</span>
          </span>
          <div className="flex-1 h-px bg-gray-200 mx-1" />
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] sm:text-xs font-bold">3</span>
            <span className="hidden sm:inline">Customize</span>
            <span className="sm:hidden">Design</span>
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
              <p className="text-sm">Loading available devices...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardContent className="p-5 sm:p-8 space-y-5 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Your Device</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Pick the brand and model of your phone</p>
                </div>
              </div>

              {/* Brand dropdown */}
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                <Select
                  id="brand"
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedModel('');
                  }}
                  className="h-11 sm:h-12 text-sm"
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
                <Label htmlFor="model" className="text-sm font-medium">Model</Label>
                <Select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedBrand}
                  className="h-11 sm:h-12 text-sm"
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
              {selectedBrandData && selectedModelData && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                    <Check className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {selectedBrandData.name} {selectedModelData.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Ready to pick a case type</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-100">
                <Link href="/">
                  <Button variant="outline" className="h-10 sm:h-11 gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </Link>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="h-10 sm:h-11 px-5 sm:px-8 gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-sm sm:text-base"
                >
                  <span>Next: Choose Case Type</span>
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
