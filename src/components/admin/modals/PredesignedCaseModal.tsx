/**
 * PredesignedCaseModal Component
 *
 * Create/edit modal for predesigned cases.
 * Standalone — no variant FK required. Selects Brand → Model → Product Type
 * directly and stores its own images.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { useToast } from '@/src/components/admin/shared/Toast';
import { ImageField } from '@/src/components/admin/shared/ImageField';
import type { PredesignedCaseVariant } from '@/src/components/admin/modules/PredesignedCaseVariantModule';
import { toProxiedUrl } from '@/src/utils/image-url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Brand { id: string; name: string; }
interface ModelItem { id: string; name: string; brand_id: string; }
interface ProductType { id: string; name: string; base_price?: number; }

interface FormData {
  brand_id: string;
  model_id: string;
  product_type_id: string;
  name: string;
  description: string;
  price_override: string;
  color_name: string;
  color_hex: string;
  display_order: string;
  is_featured: boolean;
  is_active: boolean;
}

type FormErrors = Partial<Record<
  keyof FormData | 'design_image' | 'variant_image' | 'additional_images' | 'form',
  string
>>;

export interface PredesignedCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: PredesignedCaseVariant | null;
  onSaved: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialForm(variant: PredesignedCaseVariant | null): FormData {
  return {
    brand_id: (variant as any)?.brand_id ?? '',
    model_id: (variant as any)?.model_id ?? '',
    product_type_id: (variant as any)?.product_type_id ?? '',
    name: variant?.name ?? '',
    description: variant?.description ?? '',
    price_override: variant?.price_override != null ? String(variant.price_override) : '',
    color_name: variant?.color_name ?? '',
    color_hex: variant?.color_hex ?? '#000000',
    display_order: variant?.display_order != null ? String(variant.display_order) : '0',
    is_featured: variant?.is_featured ?? false,
    is_active: variant?.is_active ?? true,
  };
}

function validateForm(
  data: FormData,
  designImageUrl: string,
  variantImageUrl: string,
  additionalImageFiles: File[],
  isEditMode: boolean,
): FormErrors {
  const errors: FormErrors = {};

  if (!data.brand_id) errors.brand_id = 'Brand is required';
  if (!data.model_id) errors.model_id = 'Model is required';
  if (!data.product_type_id) errors.product_type_id = 'Product type is required';

  if (!data.name.trim()) errors.name = 'Name is required';
  else if (data.name.trim().length > 255) errors.name = 'Name must be 255 characters or fewer';

  if (data.description.trim().length > 1000) errors.description = 'Description must be 1000 characters or fewer';

  if (data.price_override !== '') {
    const po = parseFloat(data.price_override);
    if (isNaN(po) || po < 0) errors.price_override = 'Price override must be 0 or greater';
  }

  if (!data.color_name.trim()) errors.color_name = 'Color name is required';
  else if (data.color_name.trim().length > 50) errors.color_name = 'Color name must be 50 characters or fewer';

  if (!data.color_hex.trim()) errors.color_hex = 'Color hex is required';
  else if (!HEX_REGEX.test(data.color_hex.trim())) errors.color_hex = 'Must be a valid hex color (e.g. #FF5733)';

  const doVal = data.display_order === '' ? NaN : parseInt(data.display_order, 10);
  if (isNaN(doVal) || doVal < 0 || !Number.isInteger(doVal)) {
    errors.display_order = 'Display order must be a whole number ≥ 0';
  }

  if (!isEditMode && !designImageUrl) errors.design_image = 'Design image is required';
  if (!isEditMode && !variantImageUrl) errors.variant_image = 'Variant image is required';

  for (const f of additionalImageFiles) {
    if (!ALLOWED_MIME.includes(f.type)) { errors.additional_images = 'Only JPG/PNG files are allowed'; break; }
    if (f.size > MAX_FILE_SIZE) { errors.additional_images = 'Each file must be smaller than 5 MB'; break; }
  }

  return errors;
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bucket', 'product-images');
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (HTTP ${res.status})`);
  }
  return (await res.json()).url as string;
}

// ---------------------------------------------------------------------------
// Sub-component: Additional Images Upload Field
// ---------------------------------------------------------------------------

interface AdditionalImage { key: string; file: File | null; url: string; }

interface AdditionalImagesFieldProps {
  images: AdditionalImage[];
  error?: string;
  onAdd: (files: File[]) => void;
  onAddUrl: (url: string) => void;
  onRemove: (key: string) => void;
}

function AdditionalImagesField({ images, error, onAdd, onAddUrl, onRemove }: AdditionalImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onAdd(files);
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onAddUrl(trimmed);
    setUrlValue('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Additional Images <span className="ml-1 text-xs text-gray-400">(optional)</span>
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
          Upload from device
        </button>
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
            placeholder="Paste an image URL"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlValue.trim()}
            className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleFileChange} />
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.key} className="relative group">
              <img src={toProxiedUrl(img.url)} alt="Additional image preview" className="h-20 w-20 rounded border border-gray-200 object-cover bg-gray-50" />
              <button type="button" onClick={() => onRemove(img.key)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                aria-label="Remove image">×</button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PredesignedCaseModal({ isOpen, onClose, variant, onSaved }: PredesignedCaseModalProps) {
  const { showToast } = useToast();
  const isEditMode = variant !== null;

  // ── Remote data ────────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allModels, setAllModels] = useState<ModelItem[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>(() => buildInitialForm(variant));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Image state ────────────────────────────────────────────────────────────
  const [designImageUrl, setDesignImageUrl] = useState<string>((variant as any)?.design_image_url || '');
  const [variantImageUrl, setVariantImageUrl] = useState<string>((variant as any)?.variant_image_url || '');
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);

  // ── Filtered models for selected brand ────────────────────────────────────
  const filteredModels = useMemo(
    () => allModels.filter(m => !form.brand_id || m.brand_id === form.brand_id),
    [allModels, form.brand_id]
  );

  // ── Fetch reference data on open ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    setForm(buildInitialForm(variant));
    setErrors({});
    setDesignImageUrl((variant as any)?.design_image_url || '');
    setVariantImageUrl((variant as any)?.variant_image_url || '');

    if (variant?.additional_image_urls && variant.additional_image_urls.length > 0) {
      setAdditionalImages(variant.additional_image_urls.map((url, i) => ({ key: `existing-${i}-${url}`, file: null, url })));
    } else {
      setAdditionalImages([]);
    }

    let cancelled = false;

    async function loadData() {
      setLoadingData(true);
      setDataError(null);
      try {
        const [brandsRes, modelsRes, ptRes] = await Promise.all([
          fetch('/api/brands?limit=200'),
          fetch('/api/models?limit=500'),
          fetch('/api/product-types?limit=100&active=true'),
        ]);

        if (!brandsRes.ok) throw new Error(`Failed to load brands (HTTP ${brandsRes.status})`);
        if (!modelsRes.ok) throw new Error(`Failed to load models (HTTP ${modelsRes.status})`);
        if (!ptRes.ok) throw new Error(`Failed to load product types (HTTP ${ptRes.status})`);

        const [brandsJson, modelsJson, ptJson] = await Promise.all([
          brandsRes.json(), modelsRes.json(), ptRes.json(),
        ]);

        if (cancelled) return;

        setBrands((brandsJson.brands ?? []).sort((a: Brand, b: Brand) => a.name.localeCompare(b.name)));
        setAllModels(
          (modelsJson.models ?? []).map((m: any) => ({ id: m.id, name: m.name, brand_id: m.brand_id ?? m.brand?.id ?? '' }))
            .sort((a: ModelItem, b: ModelItem) => a.name.localeCompare(b.name))
        );
        setProductTypes(
          (ptJson.product_types ?? []).sort((a: ProductType, b: ProductType) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        if (!cancelled) setDataError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [isOpen, variant]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFieldChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { if (!prev[field]) return prev; const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleBrandChange = useCallback((brand_id: string) => {
    setForm(prev => ({ ...prev, brand_id, model_id: '' }));
    setErrors(prev => { const n = { ...prev }; delete n.brand_id; delete n.model_id; return n; });
  }, []);

  const handleDesignImageChange = useCallback((url: string) => {
    setDesignImageUrl(url);
    setErrors(prev => { const n = { ...prev }; delete n.design_image; return n; });
  }, []);

  const handleVariantImageChange = useCallback((url: string) => {
    setVariantImageUrl(url);
    setErrors(prev => { const n = { ...prev }; delete n.variant_image; return n; });
  }, []);

  const handleAdditionalImagesAdd = useCallback((files: File[]) => {
    setAdditionalImages(prev => [...prev, ...files.map(f => ({ key: `new-${Date.now()}-${f.name}`, file: f, url: URL.createObjectURL(f) }))]);
    setErrors(prev => { const n = { ...prev }; delete n.additional_images; return n; });
  }, []);

  const handleAdditionalImageRemove = useCallback((key: string) => {
    setAdditionalImages(prev => prev.filter(img => img.key !== key));
  }, []);

  const handleAdditionalImageUrlAdd = useCallback((url: string) => {
    setAdditionalImages(prev => [...prev, { key: `url-${Date.now()}-${url}`, file: null, url }]);
    setErrors(prev => { const n = { ...prev }; delete n.additional_images; return n; });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const newAdditionalFiles = additionalImages.filter(img => img.file !== null).map(img => img.file!);
    const validationErrors = validateForm(
      form, designImageUrl, variantImageUrl, newAdditionalFiles, isEditMode,
    );
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setIsSaving(true);
    setErrors({});

    try {
      const additionalUrls: string[] = [];
      for (const img of additionalImages) {
        additionalUrls.push(img.file ? await uploadImage(img.file) : img.url);
      }

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price_override: form.price_override !== '' ? parseFloat(form.price_override) : undefined,
        color_name: form.color_name.trim(),
        color_hex: form.color_hex.trim(),
        display_order: parseInt(form.display_order, 10),
        is_featured: form.is_featured,
        is_active: form.is_active,
        design_image_url: designImageUrl || undefined,
        variant_image_url: variantImageUrl || undefined,
        additional_image_urls: additionalUrls.length > 0 ? additionalUrls : undefined,
      };

      let url: string;
      let method: string;

      if (isEditMode) {
        url = `/api/predesigned/${variant!.id}`;
        method = 'PATCH';
      } else {
        payload.brand_id = form.brand_id;
        payload.model_id = form.model_id;
        payload.product_type_id = form.product_type_id;
        url = '/api/predesigned';
        method = 'POST';
      }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}: Failed to save predesigned case`);
      }

      showToast(isEditMode ? 'Predesigned case updated successfully' : 'Predesigned case created successfully', 'success');
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      showToast(message, 'error');
      setErrors(prev => ({ ...prev, form: message }));
    } finally {
      setIsSaving(false);
    }
  }, [form, designImageUrl, variantImageUrl, additionalImages, variant, isEditMode, showToast, onSaved, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Predesigned Case' : 'Add Predesigned Case'} size="xl">
      {loadingData && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Loading form data…</span>
          </div>
        </div>
      )}

      {!loadingData && dataError && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-red-600 text-sm">{dataError}</p>
          <button type="button" onClick={() => setDataError(null)}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Retry</button>
        </div>
      )}

      {!loadingData && !dataError && (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {errors.form && (
            <div role="alert" className="px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm">
              {errors.form}
            </div>
          )}

          {/* Brand / Model / Product Type — only shown on create */}
          {!isEditMode && (
            <div className="space-y-4">
              {/* Brand */}
              <div>
                <label htmlFor="pc-brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select id="pc-brand" value={form.brand_id} onChange={e => handleBrandChange(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.brand_id ? 'border-red-400' : 'border-gray-300'}`}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.brand_id && <p className="mt-1 text-sm text-red-500">{errors.brand_id}</p>}
              </div>

              {/* Model */}
              <div>
                <label htmlFor="pc-model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <select id="pc-model" value={form.model_id} onChange={e => handleFieldChange('model_id', e.target.value)}
                  disabled={!form.brand_id}
                  className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.model_id ? 'border-red-400' : 'border-gray-300'} ${!form.brand_id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <option value="">Select model</option>
                  {filteredModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {errors.model_id && <p className="mt-1 text-sm text-red-500">{errors.model_id}</p>}
              </div>

              {/* Product Type */}
              <div>
                <label htmlFor="pc-product-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select id="pc-product-type" value={form.product_type_id} onChange={e => handleFieldChange('product_type_id', e.target.value)}
                  disabled={!form.model_id}
                  className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.product_type_id ? 'border-red-400' : 'border-gray-300'} ${!form.model_id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <option value="">Select product type</option>
                  {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                </select>
                {errors.product_type_id && <p className="mt-1 text-sm text-red-500">{errors.product_type_id}</p>}
              </div>
            </div>
          )}

          {/* In edit mode show a read-only summary */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {[(variant as any)?.brand?.name, (variant as any)?.model?.name, (variant as any)?.product_type?.name].filter(Boolean).join(' · ') || 'N/A'}
              </div>
              <p className="mt-1 text-xs text-gray-400">Brand, model and product type cannot be changed after creation.</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="pc-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input id="pc-name" type="text" value={form.name} onChange={e => handleFieldChange('name', e.target.value)}
              maxLength={255} placeholder="e.g. Sunset Gradient iPhone 15 Case"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`} />
            <div className="flex justify-between mt-1">
              {errors.name ? <p className="text-sm text-red-500">{errors.name}</p> : <span />}
              <span className="text-xs text-gray-400">{form.name.length}/255</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pc-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <textarea id="pc-description" value={form.description} onChange={e => handleFieldChange('description', e.target.value)}
              maxLength={1000} rows={3} placeholder="Describe this predesigned case…"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`} />
            <div className="flex justify-between mt-1">
              {errors.description ? <p className="text-sm text-red-500">{errors.description}</p> : <span />}
              <span className="text-xs text-gray-400">{form.description.length}/1000</span>
            </div>
          </div>

          {/* Price Override + Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pc-price-override" className="block text-sm font-medium text-gray-700 mb-1">
                Price Override <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input id="pc-price-override" type="number" value={form.price_override}
                  onChange={e => handleFieldChange('price_override', e.target.value)}
                  min="0" step="0.01" placeholder="0.00"
                  className={`w-full rounded-lg border pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.price_override ? 'border-red-400' : 'border-gray-300'}`} />
              </div>
              {errors.price_override && <p className="mt-1 text-sm text-red-500">{errors.price_override}</p>}
            </div>
            <div>
              <label htmlFor="pc-display-order" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order <span className="text-red-500">*</span>
              </label>
              <input id="pc-display-order" type="number" value={form.display_order}
                onChange={e => handleFieldChange('display_order', e.target.value)}
                min="0" step="1" placeholder="0"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.display_order ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.display_order && <p className="mt-1 text-sm text-red-500">{errors.display_order}</p>}
            </div>
          </div>

          {/* Color Name + Color Hex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pc-color-name" className="block text-sm font-medium text-gray-700 mb-1">
                Color Name <span className="text-red-500">*</span>
              </label>
              <input id="pc-color-name" type="text" value={form.color_name}
                onChange={e => handleFieldChange('color_name', e.target.value)}
                maxLength={50} placeholder="e.g. Midnight Black"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.color_name ? 'border-red-400' : 'border-gray-300'}`} />
              <div className="flex justify-between mt-1">
                {errors.color_name ? <p className="text-sm text-red-500">{errors.color_name}</p> : <span />}
                <span className="text-xs text-gray-400">{form.color_name.length}/50</span>
              </div>
            </div>
            <div>
              <label htmlFor="pc-color-hex" className="block text-sm font-medium text-gray-700 mb-1">
                Color Hex <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: HEX_REGEX.test(form.color_hex) ? form.color_hex : '#000000' }}>
                    <input type="color" value={HEX_REGEX.test(form.color_hex) ? form.color_hex : '#000000'}
                      onChange={e => handleFieldChange('color_hex', e.target.value.toUpperCase())}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" aria-label="Color picker" />
                  </div>
                </div>
                <input id="pc-color-hex" type="text" value={form.color_hex}
                  onChange={e => handleFieldChange('color_hex', e.target.value.toUpperCase())}
                  placeholder="#FF5733" maxLength={7}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.color_hex ? 'border-red-400' : 'border-gray-300'}`} />
              </div>
              {errors.color_hex && <p className="mt-1 text-sm text-red-500">{errors.color_hex}</p>}
            </div>
          </div>

          {/* Design Image + Variant Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageField
              id="pc-design-image"
              label="Design Image"
              required={!isEditMode}
              value={designImageUrl}
              onChange={handleDesignImageChange}
              onUpload={uploadImage}
              error={errors.design_image}
              helpText="Upload from your device or paste an image URL."
            />
            <ImageField
              id="pc-variant-image"
              label="Variant Image"
              required={!isEditMode}
              value={variantImageUrl}
              onChange={handleVariantImageChange}
              onUpload={uploadImage}
              error={errors.variant_image}
              helpText="Upload from your device or paste an image URL."
            />
          </div>

          {/* Additional Images */}
          <AdditionalImagesField images={additionalImages} error={errors.additional_images}
            onAdd={handleAdditionalImagesAdd} onAddUrl={handleAdditionalImageUrlAdd} onRemove={handleAdditionalImageRemove} />

          {/* Toggles */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              <button type="button" role="switch" aria-checked={form.is_featured}
                onClick={() => handleFieldChange('is_featured', !form.is_featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${form.is_featured ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_featured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700 cursor-pointer select-none" onClick={() => handleFieldChange('is_featured', !form.is_featured)}>
                {form.is_featured ? 'Featured' : 'Not featured'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" role="switch" aria-checked={form.is_active}
                onClick={() => handleFieldChange('is_active', !form.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${form.is_active ? 'bg-green-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700 cursor-pointer select-none" onClick={() => handleFieldChange('is_active', !form.is_active)}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSaving ? (isEditMode ? 'Saving…' : 'Creating…') : (isEditMode ? 'Save Changes' : 'Create Predesigned Case')}
            </button>
          </div>

        </form>
      )}
    </Modal>
  );
}
