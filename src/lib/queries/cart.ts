import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIME, GC_TIME } from './config'

// Types
interface CartItem {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    image_url: string
  }
  variant?: {
    id: string
    color: string
    material: string
  }
}

interface CartSummary {
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

interface Cart {
  items: CartItem[]
  summary: CartSummary
}

interface AddToCartData {
  productId: string
  variantId?: string
  quantity: number
}

interface UpdateCartItemData {
  itemId: string
  quantity: number
}

// API functions
async function fetchCart(): Promise<Cart> {
  const response = await fetch('/api/cart')
  if (!response.ok) {
    throw new Error('Failed to fetch cart')
  }
  
  return response.json()
}

async function addToCart(data: AddToCartData): Promise<CartItem> {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to add item to cart')
  }
  
  return response.json()
}

async function updateCartItem(data: UpdateCartItemData): Promise<CartItem> {
  const response = await fetch(`/api/cart/${data.itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity: data.quantity }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update cart item')
  }
  
  return response.json()
}

async function removeFromCart(itemId: string): Promise<void> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to remove item from cart')
  }
}

async function clearCart(): Promise<void> {
  const response = await fetch('/api/cart', {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to clear cart')
  }
}

// Query hooks
export function useCart() {
  return useQuery({
    queryKey: QUERY_KEYS.cartItems(),
    queryFn: fetchCart,
    staleTime: STALE_TIME.CART, // Always fresh for cart
    gcTime: GC_TIME.CART,
  })
}

// Mutation hooks with optimistic updates
export function useAddToCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addToCart,
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cartItems() })
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart>(QUERY_KEYS.cartItems())
      
      // Optimistically update the cart
      if (previousCart) {
        const optimisticItem: CartItem = {
          id: `temp-${Date.now()}`,
          product_id: newItem.productId,
          variant_id: newItem.variantId,
          quantity: newItem.quantity,
          price: 0, // Will be updated when real response comes
          product: {
            id: newItem.productId,
            name: 'Loading...',
            image_url: '',
          },
        }
        
        queryClient.setQueryData<Cart>(QUERY_KEYS.cartItems(), {
          ...previousCart,
          items: [...previousCart.items, optimisticItem],
          summary: {
            ...previousCart.summary,
            itemCount: previousCart.summary.itemCount + newItem.quantity,
          },
        })
      }
      
      return { previousCart }
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cartItems(), context.previousCart)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cartItems() })
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateCartItem,
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cartItems() })
      
      const previousCart = queryClient.getQueryData<Cart>(QUERY_KEYS.cartItems())
      
      if (previousCart) {
        const updatedItems = previousCart.items.map(item =>
          item.id === updatedItem.itemId
            ? { ...item, quantity: updatedItem.quantity }
            : item
        )
        
        queryClient.setQueryData<Cart>(QUERY_KEYS.cartItems(), {
          ...previousCart,
          items: updatedItems,
        })
      }
      
      return { previousCart }
    },
    onError: (err, updatedItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cartItems(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cartItems() })
    },
  })
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: removeFromCart,
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cartItems() })
      
      const previousCart = queryClient.getQueryData<Cart>(QUERY_KEYS.cartItems())
      
      if (previousCart) {
        const updatedItems = previousCart.items.filter(item => item.id !== itemId)
        
        queryClient.setQueryData<Cart>(QUERY_KEYS.cartItems(), {
          ...previousCart,
          items: updatedItems,
        })
      }
      
      return { previousCart }
    },
    onError: (err, itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cartItems(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cartItems() })
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cartItems() })
      
      const previousCart = queryClient.getQueryData<Cart>(QUERY_KEYS.cartItems())
      
      // Optimistically clear the cart
      queryClient.setQueryData<Cart>(QUERY_KEYS.cartItems(), {
        items: [],
        summary: {
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          itemCount: 0,
        },
      })
      
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(QUERY_KEYS.cartItems(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cartItems() })
    },
  })
}