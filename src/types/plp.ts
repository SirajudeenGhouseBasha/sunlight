export interface PLPBrand {
  id: string
  name: string
  slug: string
  logo_url?: string | null
}

export interface PLPModel {
  id: string
  name: string
  slug: string
  model_number?: string | null
  screen_size?: string | null
}

export interface PLPProductType {
  id: string
  name: string
  slug: string
  base_price: number
  description?: string | null
}

export interface PLPProduct {
  id: string
  variant_id: string
  name: string
  brand_name: string
  model_name: string
  product_type_name: string
  color_name: string
  color_hex: string | null
  price: number
  base_price: number
  price_modifier: number
  discount_percent: number | null
  image_url: string
  additional_images: string[]
  stock_quantity: number
  in_stock: boolean
}

export interface Category {
  id: string
  slug: string
  name: string
}

export interface ProductListingResponse {
  products: PLPProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface ProductListingFilters {
  category?: string
  search?: string
  sortBy?: string
  sortOrder?: string
}
