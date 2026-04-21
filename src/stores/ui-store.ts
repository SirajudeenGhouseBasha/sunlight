import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface UIState {
  // Navigation state
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  
  // Modal states
  cartOpen: boolean
  searchOpen: boolean
  
  // Theme and preferences
  theme: 'light' | 'dark' | 'system'
  
  // Search state
  searchQuery: string
  
  // Loading states
  isLoading: boolean
  loadingMessage: string
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  toggleCart: () => void
  setCartOpen: (open: boolean) => void
  toggleSearch: () => void
  setSearchOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    sidebarOpen: false,
    mobileMenuOpen: false,
    cartOpen: false,
    searchOpen: false,
    theme: 'system',
    searchQuery: '',
    isLoading: false,
    loadingMessage: '',
    
    // Actions
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
    setCartOpen: (open) => set({ cartOpen: open }),
    toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
    setSearchOpen: (open) => set({ searchOpen: open }),
    setTheme: (theme) => set({ theme }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
  }))
)