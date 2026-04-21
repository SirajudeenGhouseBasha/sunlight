/**
 * Authentication Configuration for Phone Case Platform
 * 
 * Configures Supabase authentication with email/password and OAuth providers
 * Requirements: 3.1, 3.2, 3.3 - Authentication integration and user management
 */

// Authentication configuration
export const authConfig = {
  // Email authentication settings
  email: {
    // Enable email confirmation for new signups
    confirmSignUp: true,
    // Enable email confirmation for password changes
    confirmPasswordChange: true,
    // Enable email confirmation for email changes
    confirmEmailChange: true,
  },
  
  // Password requirements
  password: {
    // Minimum password length
    minLength: 8,
    // Require at least one uppercase letter
    requireUppercase: true,
    // Require at least one lowercase letter
    requireLowercase: true,
    // Require at least one number
    requireNumbers: true,
    // Require at least one special character
    requireSpecialCharacters: true,
  },
  
  // Session configuration
  session: {
    // Session timeout in seconds (24 hours)
    timeout: 24 * 60 * 60,
    // Refresh token before expiry (1 hour before)
    refreshMargin: 60 * 60,
    // Persist session across browser sessions
    persistSession: true,
  },
  
  // Security settings
  security: {
    // Enable CAPTCHA for authentication (configure in Supabase dashboard)
    captcha: false, // Set to true in production
    // Rate limiting for authentication attempts
    rateLimit: {
      // Maximum attempts per hour
      maxAttempts: 5,
      // Lockout duration in minutes
      lockoutDuration: 15,
    },
  },
};

// OAuth provider configurations
export const oauthProviders = {
  google: {
    enabled: true,
    scopes: ['email', 'profile'],
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
  apple: {
    enabled: true,
    scopes: ['email', 'name'],
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
  github: {
    enabled: false, // Can be enabled later
    scopes: ['user:email'],
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
} as const;

// Authentication routes
export const authRoutes = {
  // Public routes (no authentication required)
  public: [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
    '/products',
    '/brands',
    '/models',
  ],
  
  // Protected routes (authentication required)
  protected: [
    '/dashboard',
    '/profile',
    '/orders',
    '/cart',
    '/designs',
    '/checkout',
  ],
  
  // Admin routes (admin role required)
  admin: [
    '/admin',
    '/admin/brands',
    '/admin/models',
    '/admin/products',
    '/admin/orders',
    '/admin/users',
    '/admin/analytics',
  ],
  
  // Redirect after successful login
  defaultRedirect: '/dashboard',
  
  // Redirect after logout
  logoutRedirect: '/',
} as const;

// User roles and permissions
export const userRoles = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof userRoles[keyof typeof userRoles];

// Permission definitions
export const permissions = {
  // Brand management
  BRANDS_READ: 'brands:read',
  BRANDS_WRITE: 'brands:write',
  
  // Model management
  MODELS_READ: 'models:read',
  MODELS_WRITE: 'models:write',
  
  // Product management
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  
  // Order management
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDERS_ADMIN: 'orders:admin',
  
  // User management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_ADMIN: 'users:admin',
  
  // Design management
  DESIGNS_READ: 'designs:read',
  DESIGNS_WRITE: 'designs:write',
  DESIGNS_ADMIN: 'designs:admin',
} as const;

// Role-based permissions mapping
const userPermissions = [
  permissions.BRANDS_READ,
  permissions.MODELS_READ,
  permissions.PRODUCTS_READ,
  permissions.ORDERS_READ,
  permissions.DESIGNS_READ,
  permissions.DESIGNS_WRITE,
];

const adminPermissions = [
  ...userPermissions,
  permissions.BRANDS_WRITE,
  permissions.MODELS_WRITE,
  permissions.PRODUCTS_WRITE,
  permissions.ORDERS_ADMIN,
  permissions.USERS_ADMIN,
  permissions.DESIGNS_ADMIN,
];

export const rolePermissions: Record<UserRole, string[]> = {
  [userRoles.USER]: userPermissions,
  [userRoles.ADMIN]: adminPermissions,
};

// Authentication error messages
export const authErrors = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_CONFIRMED: 'Please check your email and click the confirmation link',
  PASSWORD_TOO_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  USER_NOT_FOUND: 'No account found with this email',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  RATE_LIMITED: 'Too many attempts. Please try again later',
} as const;

// Validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  name: /^[a-zA-Z\s\-']{2,50}$/,
} as const;

// Environment-specific configuration
export const getAuthConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...authConfig,
    security: {
      ...authConfig.security,
      captcha: isProduction, // Enable CAPTCHA in production
    },
  };
};

export default authConfig;