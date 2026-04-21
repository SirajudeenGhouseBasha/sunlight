'use client'

import { useMemo, useCallback } from 'react'
import { useCart, useAddToCart, useUpdateCartItem, useRemoveFromCart } from '@/src/lib/queries/cart'

export function useOptimizedCart() {
  const cartQuery = useCart()
  const addToCartMutation = useAddToCart()
  const updateCartItemMutation = useUpdateCartItem()
  const removeFromCartMutation = useRemoveFromCart()

  // Memoized cart calculations
  const cartStats = useMemo(() => {
    const cart = cartQuery.data
    if (!cart) {
      return {
        itemCount: 0,
        subtotal: 0,
        total: 0,
        isEmpty: true,
      }
    }

    return {
      itemCount: cart.summary.itemCount,
      subtotal: cart.summary.subtotal,
      total: cart.summary.total,
      isEmpty: cart.items.length === 0,
    }
  }, [cartQuery.data])

  // Memoized cart items with additional computed properties
  const cartItems = useMemo(() => {
    if (!cartQuery.data?.items) return []
    
    return cartQuery.data.items.map(item => ({
      ...item,
      totalPrice: item.price * item.quantity,
      displayName: item.variant 
        ? `${item.product.name} (${item.variant.color})`
        : item.product.name,
    }))
  }, [cartQuery.data?.items])

  // Optimized action callbacks
  const addToCart = useCallback((productId: string, variantId?: string, quantity = 1) => {
    addToCartMutation.mutate({ productId, variantId, quantity })
  }, [addToCartMutation])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCartMutation.mutate(itemId)
    } else {
      updateCartItemMutation.mutate({ itemId, quantity })
    }
  }, [updateCartItemMutation, removeFromCartMutation])

  const removeItem = useCallback((itemId: string) => {
    removeFromCartMutation.mutate(itemId)
  }, [removeFromCartMutation])

  const incrementItem = useCallback((itemId: string) => {
    const item = cartItems.find(item => item.id === itemId)
    if (item) {
      updateQuantity(itemId, item.quantity + 1)
    }
  }, [cartItems, updateQuantity])

  const decrementItem = useCallback((itemId: string) => {
    const item = cartItems.find(item => item.id === itemId)
    if (item && item.quantity > 1) {
      updateQuantity(itemId, item.quantity - 1)
    }
  }, [cartItems, updateQuantity])

  // Memoized loading states
  const loadingStates = useMemo(() => ({
    isLoading: cartQuery.isLoading,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    hasError: !!cartQuery.error,
  }), [
    cartQuery.isLoading,
    cartQuery.error,
    addToCartMutation.isPending,
    updateCartItemMutation.isPending,
    removeFromCartMutation.isPending,
  ])

  return {
    // Data
    items: cartItems,
    stats: cartStats,
    
    // Actions
    addToCart,
    updateQuantity,
    removeItem,
    incrementItem,
    decrementItem,
    
    // States
    ...loadingStates,
    
    // Raw query for advanced usage
    cartQuery,
  }
}