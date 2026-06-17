'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/src/components/navigation/MainNav';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { ArrowRight, ArrowLeft, Layers, Check } from 'lucide-react';

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

const caseTypeIcons: Record<string, string> = {
  clear: '💎',
  glass: '🔮',
};

function TypeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!modelId) {
      router.replace('/custom-case');
    }
  }, [modelId, router]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/product-types?active=true');
        const data = await res.json();
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
      setLoading(true);
      const res = await fetch(`/api/variants?model_id=${modelId}&product_type_id=${typeId}`);
      const data = await res.json();
      const availableVariants = data.variants || [];
      if (availableVariants.length > 0) {
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
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white py-10 sm:py-14 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">Choose Your Case</h1>
          <p className="text-sm sm:text-lg text-orange-100">Select a case type to begin customizing</p>
        </div>
      </section>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] sm:text-xs">✓</span>
            <span className="hidden sm:inline">Select Device</span>
            <span className="sm:hidden">Device</span>
          </span>
          <div className="flex-1 h-px bg-green-200 mx-1" />
          <span className="flex items-center gap-1 text-orange-600 font-semibold">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold">2</span>
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
              <p className="text-sm">Loading case options...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Case Type selection */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Case Type</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Pick the material for your case</p>
                  </div>
                </div>

                {/* Product type cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {productTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className="group text-left p-4 sm:p-5 rounded-xl border-2 transition-all border-gray-200 hover:border-orange-500 hover:ring-2 hover:ring-orange-200 bg-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl sm:text-4xl">{caseTypeIcons[type.slug] || '📱'}</span>
                        <span className="text-base sm:text-lg font-bold text-orange-600">
                          ₹{type.base_price}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{type.name}</h3>
                      {type.description && (
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {type.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-orange-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 mt-4">
              <Link href="/custom-case">
                <Button variant="outline" className="h-10 sm:h-11 gap-2 text-sm">
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
