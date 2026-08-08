'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

export function CartDrawer() {
  const router = useRouter();
  const { cartDrawerOpen, cartDrawerItem, closeCartDrawer } = useCart();

  const handleViewCart = () => {
    closeCartDrawer();
    router.push('/cart');
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && cartDrawerItem && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCartDrawer}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 z-[100] w-full max-w-md bg-white shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Added to cart"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-green-50/60">
              <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-base leading-tight">Added to Cart</h2>
                <p className="text-xs text-gray-500 truncate">Item added successfully</p>
              </div>
              <button
                onClick={closeCartDrawer}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item details */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  {cartDrawerItem.image_url ? (
                    <img
                      src={cartDrawerItem.image_url}
                      alt={cartDrawerItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-7 h-7 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {cartDrawerItem.name}
                    </p>
                    {cartDrawerItem.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{cartDrawerItem.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      Qty: <span className="font-semibold text-gray-900">{cartDrawerItem.quantity}</span>
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{cartDrawerItem.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-gray-100 space-y-3">
              <button
                onClick={handleViewCart}
                className="w-full h-12 bg-black text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                View Cart <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={closeCartDrawer}
                className="w-full h-11 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
