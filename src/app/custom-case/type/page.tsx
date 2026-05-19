/**
 * Custom Case - Product Type & Variant Selection Page
 *
 * Step 2 of the custom case flow: user selects a case type and color variant.
 * On confirmation navigates to the product page in customization mode.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/src/components/navigation/MainNav';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Select, SelectOption } from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { ArrowRight, ArrowLeft, Layers, Palette } from 'lucide-react';

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
}

interface Variant {
  id: string;
  color_name: string;
  color_hex: string;
  price_modifier: number;
  stock_quantity: number;
}

function TypeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if no modelId
  useEffect(() => {
    if (!modelId) {
      router.replace('/custom-case');
    }
  }, [modelId, router]);

  // Fetch product types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/product-types?active=true');
        const data = await res.json();
        // Only show Clear and Glass case types
        const filteredTypes = (data.product_types || []).filter(
          (t: ProductType) => t.slug === 'clear' || t.slug === 'glass'
        );
        setProductTypes(filteredTypes);
      } catch {
        setError('Failed to load case types');
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  const handleTypeSelect = async (typeId: string) => {
    if (!modelId) return;
    
    try {
      setLoading(true); // Show spinner while fetching variant
      const res = await fetch(
        `/api/variants?model_id=${modelId}&product_type_id=${typeId}`
      );
      const data = await res.json();
      const availableVariants = data.variants || [];
      
      if (availableVariants.length > 0) {
        // Navigate immediately to the first available variant
        router.push(`/products/${availableVariants[0].id}?customize=true`);
      } else {
        setError('No cases available for this selection right now.');
        setLoading(false);
      }
    } catch {
      setError('Failed to proceed with selection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <MainNav />

      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 text-white py-10 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Choose Your Case</h1>
          <p className="text-orange-100">Select a case type to begin customizing</p>
        </div>
      </section>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span className="flex items-center gap-1.5 text-green-600 font-semibold">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">✓</span>
            Select Device
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className="flex items-center gap-1.5 text-orange-600 font-semibold">
            <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">2</span>
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
              Loading...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Case Type selection */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Case Type</h2>
                    <p className="text-sm text-gray-500">Pick the material for your case</p>
                  </div>
                </div>

                {/* Product type cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className="text-left p-4 rounded-xl border-2 transition-all border-gray-200 hover:border-orange-500 hover:ring-2 hover:ring-orange-200 bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        <span className="text-sm font-bold text-orange-600">
                          ₹{type.base_price}
                        </span>
                      </div>
                      {type.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {type.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-start mt-4">
              <Link href="/custom-case">
                <Button variant="outline" className="h-11 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CustomCaseTypePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TypeSelectionContent />
    </Suspense>
  );
}
