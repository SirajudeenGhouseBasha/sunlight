import { useState, useEffect, useMemo } from 'react';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface PhoneModel {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
}

export function useBrandsAndModels(selectedBrandId?: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [brandsRes, modelsRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/models'),
        ]);

        if (!active) return;

        if (!brandsRes.ok || !modelsRes.ok) {
          throw new Error('Failed to fetch brand or model data');
        }

        const [brandsData, modelsData] = await Promise.all([
          brandsRes.json(),
          modelsRes.json(),
        ]);

        setBrands(brandsData.brands || []);
        setModels(modelsData.models || []);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const filteredModels = useMemo(() => {
    if (!selectedBrandId) return [];
    return models.filter((m) => m.brand_id === selectedBrandId);
  }, [selectedBrandId, models]);

  return {
    brands,
    models,
    filteredModels,
    loading,
    error,
  };
}
