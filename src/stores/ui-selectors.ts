import { useUIStore } from './ui-store'

// Selective subscriptions to prevent unnecessary re-renders
// Each hook only subscribes to specific parts of the state

// Navigation selectors
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useMobileMenuOpen = () => useUIStore((state) => state.mobileMenuOpen)

// Modal selectors
export const useCartOpen = () => useUIStore((state) => state.cartOpen)
export const useSearchOpen = () => useUIStore((state) => state.searchOpen)

// Theme selector
export const useTheme = () => useUIStore((state) => state.theme)

// Search selectors
export const useSearchQuery = () => useUIStore((state) => state.searchQuery)

// Loading selectors
export const useIsLoading = () => useUIStore((state) => state.isLoading)
export const useLoadingMessage = () => useUIStore((state) => state.loadingMessage)
export const useLoadingState = () => useUIStore((state) => ({
  isLoading: state.isLoading,
  message: state.loadingMessage,
}))

// Action selectors (these don't cause re-renders since actions are stable)
export const useSidebarActions = () => useUIStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
}))

export const useMobileMenuActions = () => useUIStore((state) => ({
  toggleMobileMenu: state.toggleMobileMenu,
  setMobileMenuOpen: state.setMobileMenuOpen,
}))

export const useCartActions = () => useUIStore((state) => ({
  toggleCart: state.toggleCart,
  setCartOpen: state.setCartOpen,
}))

export const useSearchActions = () => useUIStore((state) => ({
  toggleSearch: state.toggleSearch,
  setSearchOpen: state.setSearchOpen,
  setSearchQuery: state.setSearchQuery,
}))

export const useThemeActions = () => useUIStore((state) => ({
  setTheme: state.setTheme,
}))

export const useLoadingActions = () => useUIStore((state) => ({
  setLoading: state.setLoading,
}))

// Combined selectors for components that need multiple related pieces of state
export const useNavigationState = () => useUIStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  mobileMenuOpen: state.mobileMenuOpen,
}))

export const useModalState = () => useUIStore((state) => ({
  cartOpen: state.cartOpen,
  searchOpen: state.searchOpen,
}))

export const useSearchState = () => useUIStore((state) => ({
  searchOpen: state.searchOpen,
  searchQuery: state.searchQuery,
}))