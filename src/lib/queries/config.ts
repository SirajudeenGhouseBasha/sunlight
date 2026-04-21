// Query configuration constants for different data types

export const QUERY_KEYS = {
  // Product-related queries
  products: ['products'] as const,
  productList: (filters?: Record<string, any>) => [...QUERY_KEYS.products, 'list', filters] as const,
  productDetail: (id: string) => [...QUERY_KEYS.products, 'detail', id] as const,
  productSearch: (query: string) => [...QUERY_KEYS.products, 'search', query] as const,
  
  // User-related queries
  users: ['users'] as const,
  userProfile: (id: string) => [...QUERY_KEYS.users, 'profile', id] as const,
  
  // Cart-related queries
  cart: ['cart'] as const,
  cartItems: () => [...QUERY_KEYS.cart, 'items'] as const,
  
  // Order-related queries
  orders: ['orders'] as const,
  orderList: (userId: string) => [...QUERY_KEYS.orders, 'list', userId] as const,
  orderDetail: (id: string) => [...QUERY_KEYS.orders, 'detail', id] as const,
  
  // Design-related queries
  designs: ['designs'] as const,
  designList: (userId: string) => [...QUERY_KEYS.designs, 'list', userId] as const,
  designDetail: (id: string) => [...QUERY_KEYS.designs, 'detail', id] as const,
} as const

// Stale time configurations for different data types
export const STALE_TIME = {
  // Static data - cache for 1 hour
  STATIC: 60 * 60 * 1000,
  // Product catalog - cache for 5 minutes
  PRODUCTS: 5 * 60 * 1000,
  // User data - cache for 2 minutes
  USER: 2 * 60 * 1000,
  // Cart data - always fresh
  CART: 0,
  // Search results - cache for 1 minute
  SEARCH: 1 * 60 * 1000,
} as const

// Garbage collection time configurations
export const GC_TIME = {
  // Keep static data for 2 hours after component unmount
  STATIC: 2 * 60 * 60 * 1000,
  // Keep product data for 10 minutes after component unmount
  PRODUCTS: 10 * 60 * 1000,
  // Keep user data for 5 minutes after component unmount
  USER: 5 * 60 * 1000,
  // Keep cart data for 1 minute after component unmount
  CART: 1 * 60 * 1000,
  // Keep search results for 30 seconds after component unmount
  SEARCH: 30 * 1000,
} as const