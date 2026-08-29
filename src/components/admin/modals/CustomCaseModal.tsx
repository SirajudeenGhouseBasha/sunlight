/**
 * CustomCaseModal Component
 *
 * Self-contained create/edit modal for custom case variants.
 * Fetches its own models and product types on mount.
 *
 * Requirements: 5.1–5.13, 6.1–6.8, 12.1–12.6, 14.1–14.5, 15.1–15.6,
 *               16.1–16.8, 27.1–27.7, 28.1–28.5
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { useToast } from '@/src/components/admin/shared/Toast';
import { ImageField } from '@/src/components/admin/shared/ImageField';
import { ProductTypeForm, type ProductType as ProductTypeFormType } from '@/src/components/admin/forms/ProductTypeForm';
import type { CustomCaseVariant, Model } from '@/src/components/admin/modules/CustomCaseVariantModule';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  case_type: string; // 'custom' or 'predesigned'
  model_id: string;
  product_type_id: string;
  name: string;
  description: string;
  color_name: string;
  color_hex: string;
  price_modifier: string;
  stock_quantity: string;
  is_active: boolean;
}

interface ProductType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

type FormErrors = Partial<Record<keyof FormData | 'form', string>>;

export interface CustomCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = create mode, non-null = edit mode */
  variant: CustomCaseVariant | null;
  onSaved: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialForm(variant: CustomCaseVariant | null): FormData {
  return {
    case_type: variant?.case_type ?? 'custom',
    model_id: variant?.model_id ?? '',
    product_type_id: variant?.product_type_id ?? '',
    name: variant?.name ?? '',
    description: variant?.description ?? '',
    color_name: variant?.color_name ?? '',
    color_hex: variant?.color_hex ?? '#000000',
    price_modifier: variant?.price_modifier != null ? String(variant.price_modifier) : '',
    stock_quantity: variant?.stock_quantity != null ? String(variant.stock_quantity) : '0',
    is_active: variant?.is_active ?? true,
  };
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.case_type) errors.case_type = 'Case type is required';
  if (!data.model_id) errors.model_id = 'Model is required';
  if (!data.product_type_id) errors.product_type_id = 'Product type is required';

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or fewer';
  }

  if (data.description.trim().length > 500) {
    errors.description = 'Description must be 500 characters or fewer';
  }

  if (!data.color_name.trim()) {
    errors.color_name = 'Color name is required';
  } else if (data.color_name.trim().length > 50) {
    errors.color_name = 'Color name must be 50 characters or fewer';
  }

  if (!data.color_hex.trim()) {
    errors.color_hex = 'Color hex is required';
  } else if (!HEX_REGEX.test(data.color_hex.trim())) {
    errors.color_hex = 'Must be a valid hex color (e.g. #FF5733)';
  }

  if (data.price_modifier !== '') {
    const pm = parseFloat(data.price_modifier);
    if (isNaN(pm) || pm < 0) errors.price_modifier = 'Price modifier must be 0 or greater';
  }

  const sq = parseInt(data.stock_quantity, 10);
  if (data.stock_quantity === '' || isNaN(sq) || sq < 0 || !Number.isInteger(sq)) {
    errors.stock_quantity = 'Stock quantity must be a whole number ≥ 0';
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
  const json = await res.json();
  return json.url as string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CustomCaseModal({ isOpen, onClose, variant, onSaved }: CustomCaseModalProps) {
  const { showToast } = useToast();
  const isEditMode = variant !== null;

  // ── Remote data ────────────────────────────────────────────────────────────
  const [models, setModels] = useState<Model[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // ── Product Type Design Modal ──────────────────────────────────────────────
  const [isProductTypeModalOpen, setIsProductTypeModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductTypeFormType | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>(() => buildInitialForm(variant));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Image state ────────────────────────────────────────────────────────────
  const [imageUrl, setImageUrl] = useState<string>(variant?.image_url || '');
  const [maskUrl, setMaskUrl] = useState<string>(variant?.mask_image_url || '');

  // ── Fetch models + product types on open ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Reset form when modal opens
    setForm(buildInitialForm(variant));
    setErrors({});
    setImageUrl(variant?.image_url || '');
    setMaskUrl(variant?.mask_image_url || '');

    let cancelled = false;

    async function loadData() {
      setLoadingData(true);
      setDataError(null);
      try {
        const [modelsRes, typesRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/product-types'),
        ]);

        if (!modelsRes.ok) throw new Error(`Failed to load models (HTTP ${modelsRes.status})`);
        if (!typesRes.ok) throw new Error(`Failed to load product types (HTTP ${typesRes.status})`);

        const modelsJson = await modelsRes.json();
        const typesJson = await typesRes.json();

        if (cancelled) return;

        const fetchedModels: Model[] = modelsJson.models ?? modelsJson ?? [];
        const fetchedTypes: ProductType[] = typesJson.productTypes ?? typesJson.product_types ?? typesJson ?? [];

        setModels(fetchedModels);
        setProductTypes(fetchedTypes);

        // Auto-select first option if no value set yet
        setForm(prev => ({
          ...prev,
          model_id: prev.model_id || fetchedModels[0]?.id || '',
          product_type_id: prev.product_type_id || fetchedTypes[0]?.id || '',
        }));
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : 'Failed to load form data');
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [isOpen, variant]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFieldChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const handleCaseImageChange = useCallback((url: string) => {
    setImageUrl(url);
  }, []);

  const handleMaskImageChange = useCallback((url: string) => {
    setMaskUrl(url);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const payload = {
        case_type: form.case_type,
        model_id: form.model_id,
        product_type_id: form.product_type_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        color_name: form.color_name.trim(),
        color_hex: form.color_hex.trim(),
        price_modifier: form.price_modifier !== '' ? parseFloat(form.price_modifier) : undefined,
        stock_quantity: parseInt(form.stock_quantity, 10),
        image_url: imageUrl,
        mask_image_url: maskUrl,
        is_active: form.is_active,
      };

      const url = isEditMode ? `/api/variants/${variant!.id}` : '/api/variants';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const apiError: string = body.error ?? `HTTP ${res.status}: Failed to save variant`;

        // Detect duplicate / uniqueness constraint violations
        const isDuplicate =
          res.status === 409 ||
          /duplicate|unique|already exists|conflict/i.test(apiError);

        if (isDuplicate) {
          const duplicateMessage =
            'A custom case variant with this model, product type, and color already exists.';
          setErrors(prev => ({
            ...prev,
            form: duplicateMessage,
            color_name: duplicateMessage,
          }));
          showToast(duplicateMessage, 'error');
          return;
        }

        throw new Error(apiError);
      }

      showToast(
        isEditMode ? 'Custom case variant updated successfully' : 'Custom case variant created successfully',
        'success'
      );
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      showToast(message, 'error');
      setErrors(prev => ({ ...prev, form: message }));
    } finally {
      setIsSaving(false);
    }
  }, [form, imageUrl, maskUrl, variant, isEditMode, showToast, onSaved, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Custom Case Variant' : 'Add Custom Case Variant'}
      size="xl"
    >
      {/* Loading skeleton */}
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

      {/* Data load error */}
      {!loadingData && dataError && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-red-600 text-sm">{dataError}</p>
          <button
            type="button"
            onClick={() => setDataError(null)}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Form */}
      {!loadingData && !dataError && (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Form-level error */}
          {errors.form && (
            <div role="alert" className="px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm">
              {errors.form}
            </div>
          )}

          {/* Case Type */}
          <div>
            <label htmlFor="cc-case-type" className="block text-sm font-medium text-gray-700 mb-1">
              Case Type <span className="text-red-500">*</span>
            </label>
            <select
              id="cc-case-type"
              value={form.case_type}
              onChange={e => handleFieldChange('case_type', e.target.value)}
              disabled={loadingData}
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.case_type ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select case type</option>
              <option value="custom">Custom Designed</option>
              <option value="predesigned">Predesigned</option>
            </select>
            {errors.case_type && <p className="mt-1 text-sm text-red-500">{errors.case_type}</p>}
          </div>

          {/* Row 1: Model + Product Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model */}
            <div>
              <label htmlFor="cc-model" className="block text-sm font-medium text-gray-700 mb-1">
                Model <span className="text-red-500">*</span>
              </label>
              <select
                id="cc-model"
                value={form.model_id}
                onChange={e => handleFieldChange('model_id', e.target.value)}
                disabled={models.length === 0}
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.model_id ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                {models.length === 0 && <option value="">No models available</option>}
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {errors.model_id && <p className="mt-1 text-sm text-red-500">{errors.model_id}</p>}
            </div>

            {/* Product Type */}
            <div>
              <label htmlFor="cc-product-type" className="block text-sm font-medium text-gray-700 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="cc-product-type"
                  value={form.product_type_id}
                  onChange={e => handleFieldChange('product_type_id', e.target.value)}
                  disabled={productTypes.length === 0}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.product_type_id ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  {productTypes.length === 0 && <option value="">No product types available</option>}
                  {productTypes.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsProductTypeModalOpen(true)}
                  title="Design product type"
                  className="px-3 py-2 text-sm bg-blue-50 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  ⚙️
                </button>
              </div>
              {errors.product_type_id && <p className="mt-1 text-sm text-red-500">{errors.product_type_id}</p>}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="cc-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="cc-name"
              type="text"
              value={form.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              maxLength={100}
              placeholder="e.g. Midnight Black Slim Case"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.name
                ? <p className="text-sm text-red-500">{errors.name}</p>
                : <span />}
              <span className="text-xs text-gray-400">{form.name.length}/100</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="cc-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="ml-1 text-xs text-gray-400">(optional — shown on product page)</span>
            </label>
            <textarea
              id="cc-description"
              value={form.description}
              onChange={e => handleFieldChange('description', e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. Slim-fit silicone case with a matte finish. Provides excellent grip and drop protection while keeping your phone looking sleek."
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                errors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.description
                ? <p className="text-sm text-red-500">{errors.description}</p>
                : <span />}
              <span className="text-xs text-gray-400">{form.description.length}/500</span>
            </div>
          </div>

          {/* Row 2: Color Name + Color Hex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Name */}
            <div>
              <label htmlFor="cc-color-name" className="block text-sm font-medium text-gray-700 mb-1">
                Color Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cc-color-name"
                type="text"
                value={form.color_name}
                onChange={e => handleFieldChange('color_name', e.target.value)}
                maxLength={50}
                placeholder="e.g. Midnight Black"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.color_name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.color_name
                  ? <p className="text-sm text-red-500">{errors.color_name}</p>
                  : <span />}
                <span className="text-xs text-gray-400">{form.color_name.length}/50</span>
              </div>
            </div>

            {/* Color Hex */}
            <div>
              <label htmlFor="cc-color-hex" className="block text-sm font-medium text-gray-700 mb-1">
                Color Hex <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {/* Color swatch / native picker */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: HEX_REGEX.test(form.color_hex) ? form.color_hex : '#000000' }}
                    title="Click to open color picker"
                  >
                    <input
                      type="color"
                      value={HEX_REGEX.test(form.color_hex) ? form.color_hex : '#000000'}
                      onChange={e => handleFieldChange('color_hex', e.target.value.toUpperCase())}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      aria-label="Color picker"
                    />
                  </div>
                </div>
                <input
                  id="cc-color-hex"
                  type="text"
                  value={form.color_hex}
                  onChange={e => handleFieldChange('color_hex', e.target.value.toUpperCase())}
                  placeholder="#FF5733"
                  maxLength={7}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.color_hex ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.color_hex && <p className="mt-1 text-sm text-red-500">{errors.color_hex}</p>}
            </div>
          </div>

          {/* Row 3: Price Modifier + Stock Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Modifier */}
            <div>
              <label htmlFor="cc-price-modifier" className="block text-sm font-medium text-gray-700 mb-1">
                Price Modifier
                <span className="ml-1 text-xs text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  id="cc-price-modifier"
                  type="number"
                  value={form.price_modifier}
                  onChange={e => handleFieldChange('price_modifier', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full rounded-lg border pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.price_modifier ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.price_modifier && <p className="mt-1 text-sm text-red-500">{errors.price_modifier}</p>}
            </div>

            {/* Stock Quantity */}
            <div>
              <label htmlFor="cc-stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="cc-stock"
                type="number"
                value={form.stock_quantity}
                onChange={e => handleFieldChange('stock_quantity', e.target.value)}
                min="0"
                step="1"
                placeholder="0"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.stock_quantity ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.stock_quantity && <p className="mt-1 text-sm text-red-500">{errors.stock_quantity}</p>}
            </div>
          </div>

          {/* Row 4: Image uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageField
              id="cc-case-image"
              label="Case Image (optional)"
              value={imageUrl}
              onChange={handleCaseImageChange}
              onUpload={uploadImage}
              helpText="Upload from your device or paste an image URL."
            />
            <ImageField
              id="cc-mask-image"
              label="Mask Image (optional)"
              value={maskUrl}
              onChange={handleMaskImageChange}
              onUpload={uploadImage}
              helpText="Upload from your device or paste an image URL."
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => handleFieldChange('is_active', !form.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                form.is_active ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
              onClick={() => handleFieldChange('is_active', !form.is_active)}
            >
              {form.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving
                ? (isEditMode ? 'Saving…' : 'Creating…')
                : (isEditMode ? 'Save Changes' : 'Create Variant')}
            </button>
          </div>

        </form>
      )}
    </Modal>

    {/* Product Type Design Modal */}
    <Modal
      isOpen={isProductTypeModalOpen}
      onClose={() => {
        setIsProductTypeModalOpen(false);
        setEditingProductType(null);
      }}
      title="Design Product Type"
      size="md"
    >
      <ProductTypeForm
        productType={editingProductType}
        onSave={async (data) => {
          try {
            const url = editingProductType ? `/api/product-types/${editingProductType.id}` : '/api/product-types';
            const method = editingProductType ? 'PATCH' : 'POST';
            
            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? `HTTP ${res.status}: Failed to save product type`);
            }

            const savedType = await res.json();
            
            // Update product types list
            setProductTypes(prev => {
              if (editingProductType) {
                return prev.map(pt => pt.id === editingProductType.id ? savedType : pt);
              } else {
                return [...prev, savedType];
              }
            });

            showToast(
              editingProductType ? 'Product type updated successfully' : 'Product type created successfully',
              'success'
            );
            
            setIsProductTypeModalOpen(false);
            setEditingProductType(null);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save product type';
            showToast(message, 'error');
          }
        }}
        onCancel={() => {
          setIsProductTypeModalOpen(false);
          setEditingProductType(null);
        }}
      />
    </Modal>
    </>
  );
}
