/**
 * Product Type Definitions for Phone Case Platform
 * 
 * TypeScript interfaces for product types, variants, and pricing
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Product type and variant management
 */

// Base product type interface
export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  material_properties?: MaterialProperties;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Material properties for different case types
export interface MaterialProperties {
  durability: 'low' | 'medium' | 'high' | 'premium';
  flexibility: 'rigid' | 'semi-flexible' | 'flexible';
  transparency: 'opaque' | 'translucent' | 'transparent';
  texture: 'smooth' | 'textured' | 'matte' | 'glossy';
  protection_level: 'basic' | 'standard' | 'enhanced' | 'maximum';
  weight: 'light' | 'medium' | 'heavy';
  grip: 'low' | 'medium' | 'high';
  scratch_resistance: 'low' | 'medium' | 'high';
  drop_protection: 'basic' | 'standard' | 'military_grade';
}

// Product variant interface
export interface ProductVariant {
  id: string;
  model_id: string;
  product_type_id: string;
  name: string;
  color_name: string;
  color_hex?: string;
  price_modifier: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  model?: PhoneModel;
  product_type?: ProductType;
}

// Phone model interface (from brands/models)
export interface PhoneModel {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  model_number?: string;
  release_year?: number;
  screen_size?: number;
  dimensions?: PhoneDimensions;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  brand?: Brand;
}

// Brand interface
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Phone dimensions
export interface PhoneDimensions {
  width: number;  // in mm
  height: number; // in mm
  depth: number;  // in mm
}

// Color definition
export interface Color {
  name: string;
  hex: string;
  category: 'basic' | 'premium' | 'special' | 'gradient';
  is_popular: boolean;
}

// Pricing structure
export interface PricingTier {
  base_price: number;
  variant_modifier: number;
  customization_fee: number;
  bulk_discount?: BulkDiscount[];
}

export interface BulkDiscount {
  min_quantity: number;
  discount_percentage: number;
}

// Product catalog item (combined view)
export interface CatalogProduct {
  id: string;
  model: PhoneModel;
  product_type: ProductType;
  variants: ProductVariant[];
  total_price: number;
  available_colors: Color[];
  in_stock: boolean;
  popularity_score?: number;
}

// Predefined product types
export const PRODUCT_TYPES = {
  SILICONE: {
    name: 'Silicone',
    slug: 'silicone',
    description: 'Flexible silicone case with excellent grip and shock absorption',
    material_properties: {
      durability: 'medium',
      flexibility: 'flexible',
      transparency: 'opaque',
      texture: 'textured',
      protection_level: 'standard',
      weight: 'light',
      grip: 'high',
      scratch_resistance: 'medium',
      drop_protection: 'standard',
    } as MaterialProperties,
    base_price: 15.99,
  },
  
  CLEAR: {
    name: 'Clear',
    slug: 'clear',
    description: 'Transparent case showcasing your phone\'s original design',
    material_properties: {
      durability: 'medium',
      flexibility: 'semi-flexible',
      transparency: 'transparent',
      texture: 'smooth',
      protection_level: 'basic',
      weight: 'light',
      grip: 'medium',
      scratch_resistance: 'high',
      drop_protection: 'basic',
    } as MaterialProperties,
    base_price: 12.99,
  },
  
  GLASS: {
    name: 'Glass',
    slug: 'glass',
    description: 'Premium tempered glass back with enhanced protection',
    material_properties: {
      durability: 'high',
      flexibility: 'rigid',
      transparency: 'transparent',
      texture: 'glossy',
      protection_level: 'enhanced',
      weight: 'medium',
      grip: 'medium',
      scratch_resistance: 'high',
      drop_protection: 'enhanced',
    } as MaterialProperties,
    base_price: 24.99,
  },
  
  LEATHER: {
    name: 'Leather',
    slug: 'leather',
    description: 'Premium leather case with sophisticated look and feel',
    material_properties: {
      durability: 'high',
      flexibility: 'semi-flexible',
      transparency: 'opaque',
      texture: 'textured',
      protection_level: 'standard',
      weight: 'medium',
      grip: 'high',
      scratch_resistance: 'medium',
      drop_protection: 'standard',
    } as MaterialProperties,
    base_price: 34.99,
  },
} as const;

// Predefined colors
export const COLORS: Record<string, Color> = {
  BLACK: { name: 'Black', hex: '#000000', category: 'basic', is_popular: true },
  WHITE: { name: 'White', hex: '#FFFFFF', category: 'basic', is_popular: true },
  CLEAR: { name: 'Clear', hex: '#FFFFFF', category: 'basic', is_popular: true },
  RED: { name: 'Red', hex: '#DC2626', category: 'basic', is_popular: true },
  BLUE: { name: 'Blue', hex: '#2563EB', category: 'basic', is_popular: true },
  GREEN: { name: 'Green', hex: '#16A34A', category: 'basic', is_popular: false },
  PURPLE: { name: 'Purple', hex: '#9333EA', category: 'basic', is_popular: false },
  PINK: { name: 'Pink', hex: '#EC4899', category: 'basic', is_popular: true },
  YELLOW: { name: 'Yellow', hex: '#EAB308', category: 'basic', is_popular: false },
  ORANGE: { name: 'Orange', hex: '#EA580C', category: 'basic', is_popular: false },
  
  // Premium colors
  ROSE_GOLD: { name: 'Rose Gold', hex: '#E8B4B8', category: 'premium', is_popular: true },
  SPACE_GRAY: { name: 'Space Gray', hex: '#4A5568', category: 'premium', is_popular: true },
  MIDNIGHT_BLUE: { name: 'Midnight Blue', hex: '#1E3A8A', category: 'premium', is_popular: false },
  FOREST_GREEN: { name: 'Forest Green', hex: '#065F46', category: 'premium', is_popular: false },
  
  // Special colors
  RAINBOW: { name: 'Rainbow', hex: '#FF6B6B', category: 'special', is_popular: false },
  HOLOGRAPHIC: { name: 'Holographic', hex: '#A855F7', category: 'special', is_popular: false },
} as const;

// Utility types
export type ProductTypeName = keyof typeof PRODUCT_TYPES;
export type ColorName = keyof typeof COLORS;

// API response types
export interface ProductTypesResponse {
  product_types: ProductType[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VariantsResponse {
  variants: ProductVariant[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types for admin interfaces
export interface CreateProductTypeForm {
  name: string;
  description?: string;
  material_properties?: Partial<MaterialProperties>;
  base_price: number;
}

export interface CreateVariantForm {
  model_id: string;
  product_type_id: string;
  color_name: string;
  color_hex?: string;
  price_modifier: number;
  stock_quantity: number;
}

// Pricing calculation utilities
export interface PriceCalculation {
  base_price: number;
  variant_modifier: number;
  customization_fee: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
}

// Stock management
export interface StockLevel {
  variant_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

// Search and filtering
export interface ProductFilter {
  brand_ids?: string[];
  model_ids?: string[];
  product_type_ids?: string[];
  colors?: string[];
  price_range?: {
    min: number;
    max: number;
  };
  in_stock_only?: boolean;
  popular_only?: boolean;
}

export interface ProductSearchResult {
  products: CatalogProduct[];
  total_count: number;
  filters_applied: ProductFilter;
  suggested_filters?: Partial<ProductFilter>;
}