'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { motion, useInView as useFramerInView } from 'framer-motion';
import { Check, Palette, Sparkle, Sparkles, Star } from 'lucide-react';
import { PredesignedProductGallery } from '@/src/components/products/PredesignedProductGallery';

const CARD_SURFACE = 'rgba(255, 255, 255, 0.28)';
const CARD_SURFACE_HOVER = 'rgba(255, 255, 255, 0.42)';
import { useCart } from '@/src/context/CartContext';
import { Toaster, toast } from 'react-hot-toast';
import heroImage from '@/src/assets/landing-hero-1.png';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  variant_id: string;
  slug: string;
  name: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  model: {
    id: string;
    name: string;
    slug: string;
  };
  product_type: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  color_name: string;
  color_hex?: string;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
  href: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface HomePageClientProps {
  featuredProducts: Product[];
  brands: Brand[];
  productTypes: ProductType[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useCounter(end: number, duration: number = 2000, started: boolean = false): number {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, started]);
  return count;
}

function useInView(threshold: number = 0.2): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState<boolean>(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface PhoneMockupProps {
  color?: string;
  label?: string;
  delay?: number;
  scale?: number;
}

function PhoneMockup({ color = '#000', label, delay = 0, scale = 1 }: PhoneMockupProps) {
  return (
    <div style={{
      transform: `scale(${scale})`,
      animation: `floatPhone 4s ease-in-out ${delay}s infinite`,
    }}>
      <div style={{
        width: 80, height: 140,
        background: 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
        borderRadius: 16,
        border: `2px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px #d1d5db',
      }}>
        <div style={{
          position: 'absolute', inset: 4,
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          borderRadius: 12,
          border: `1px solid ${color}66`,
        }} />
        <div style={{
          position: 'absolute', bottom: 8, left: '50%',
          transform: 'translateX(-50%)',
          width: 24, height: 3, background: '#999', borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', top: 10, left: '50%',
          transform: 'translateX(-50%)',
          width: 20, height: 4, background: '#ccc', borderRadius: 10,
        }} />
        {label && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color, fontWeight: 700, letterSpacing: 1,
          }}>{label}</div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  delay: number;
  onAddToCart: (variantId: string) => void;
}

function ProductCard({ product, delay, onAddToCart }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useFramerInView(ref, { once: true, margin: '-100px' });
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -8 }}
    >
      <div
        style={{
          background: hovered ? CARD_SURFACE_HOVER : CARD_SURFACE,
          border: `1px solid ${hovered ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
          borderRadius: 12,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: hovered ? '0 20px 40px rgba(0, 0, 0, 0.08)' : 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Link href={`/products/${product.variant_id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            height: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle at 50% 60%, ${product.color_hex}18 0%, transparent 70%)`,
            position: 'relative',
            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              width: 80, height: 130,
              background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
              borderRadius: 14,
              border: `2px solid ${product.color_hex || '#000'}`,
              boxShadow: `0 0 30px ${product.color_hex}44, inset 0 0 20px ${product.color_hex}11`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${product.color_hex}22, transparent)`,
              }} />
            </div>
            {!product.in_stock && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: '#ef4444', color: '#fff',
                fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 20, letterSpacing: 1,
              }}>OUT OF STOCK</div>
            )}
          </div>
        </Link>

        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{
            display: 'inline-block',
            background: `${product.color_hex}22`,
            color: product.color_hex || '#000',
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            padding: '4px 10px', borderRadius: 20, marginBottom: 10,
            border: `1px solid ${product.color_hex}44`,
          }}>{product.product_type.name}</div>

          <Link href={`/products/${product.variant_id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              fontSize: 15, fontWeight: 600, color: '#000',
              marginBottom: 6, lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>{product.name}</div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            {product.color_hex && (
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: product.color_hex, border: '1px solid #ddd',
              }} />
            )}
            <span style={{ fontSize: 12, color: '#666' }}>{product.color_name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#000' }}>
              ₹{product.price.toFixed(2)}
            </span>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                onAddToCart(product.variant_id);
                toast.success(`Added to cart!`, {
                  style: {
                    background: '#f3f4f6',
                    color: '#000',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  },
                  icon: <Check size={16} strokeWidth={2.5} />,
                });
              }}
              disabled={!product.in_stock}
              style={{
                background: hovered && product.in_stock ? '#000' : 'transparent',
                border: `1px solid ${product.in_stock ? '#000' : '#ddd'}`,
                color: hovered && product.in_stock ? '#fff' : '#666',
                padding: '8px 18px', borderRadius: 30,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                cursor: product.in_stock ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                opacity: product.in_stock ? 1 : 0.5,
              }}
            >{product.in_stock ? 'ADD' : 'SOLD OUT'}</motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function StatCard({ value, suffix, label, delay }: StatCardProps) {
  const [ref, inView] = useInView();
  const count = useCounter(value, 2000, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay }}
    >
      <div style={{
        textAlign: 'center', padding: '32px 20px',
        background: CARD_SURFACE,
        border: '1px solid rgba(0, 0, 0, 0.04)',
        borderRadius: 12,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{
          fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 8, color: '#000',
        }}>
          {count}{suffix}
        </div>
        <div style={{ fontSize: 13, color: '#666', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  index: number;
}

function FeatureCard({ icon, title, desc, index }: FeatureCardProps) {
  const [ref, inView] = useInView(0.1);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{
        display: 'flex', gap: 24, alignItems: 'flex-start',
        padding: 32, background: CARD_SURFACE,
        border: '1px solid rgba(0, 0, 0, 0.04)', borderRadius: 12,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{
        fontSize: 32, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#000', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </motion.div>
  );
}

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  index: number;
}

function AnimatedTestimonial({ quote, author, role, index }: TestimonialProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useFramerInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      style={{
        padding: '32px',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        borderRadius: 12,
        background: CARD_SURFACE,
        cursor: 'pointer',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} fill="#000" stroke="#000" />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: index * 0.1 + 0.2 }}
        style={{ fontSize: 15, color: '#333', lineHeight: 1.8, marginBottom: 24 }}
      >
        "{quote}"
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ delay: index * 0.1 + 0.3 }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: '#000', marginBottom: 4 }}>
          {author}
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>{role}</div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function HomePageClientAdvanced({
  featuredProducts,
  brands,
  productTypes,
}: HomePageClientProps) {
  const { addToCart } = useCart();
  const [heroVisible, setHeroVisible] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showAllTypes, setShowAllTypes] = useState(false);
  const INITIAL_TYPE_COUNT = 6;
  const visibleTypes = showAllTypes ? productTypes : productTypes.slice(0, INITIAL_TYPE_COUNT);
  const hasMoreTypes = productTypes.length > INITIAL_TYPE_COUNT;

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAddToCart = async (variantId: string) => {
    try {
      await addToCart(variantId);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div
      className="sunlight-home"
      style={{
      background: 'transparent',
      color: '#000',
      fontFamily: 'var(--font-outfit), var(--font-geist-sans), system-ui, sans-serif',
      overflowX: 'hidden',
      minHeight: '100vh',
    }}>
      <style>{`
        .sunlight-home,
        .sunlight-home * {
          box-sizing: border-box;
        }

        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-20px) rotate(2deg); }
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @media (max-width: 768px) {
          section:first-of-type {
            backgroundPosition: 'center right' !important;
            backgroundSize: 'cover' !important;
          }
        }

        @media (max-width: 640px) {
          .home-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .home-grid-shop-type { grid-template-columns: repeat(2, 1fr) !important; }
          .home-grid-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .home-grid-footer { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
        }
      `}</style>

      <Toaster position="bottom-right" />

      {/* ─── HERO ─── */}
      <section style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 0,
      }}>
        <Link href="/custom-case" style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          cursor: 'pointer',
        }}>
          <img
            src={heroImage.src}
            alt="Sunlight Premium Cases - Customised For You"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </Link>
      </section>

      {/* ─── MARQUEE ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          overflow: 'hidden',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: 'clamp(12px, 3vw, 18px) 0',
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', animation: 'marquee 25s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...Array(4)].flatMap((_, ai) =>
            ['PREMIUM QUALITY', 'CUSTOM DESIGNS', 'FREE SHIPPING', 'DROP PROTECTED', 'PERFECT FIT', '30-DAY RETURNS'].map((t) => (
              <span key={`${ai}-${t}`} style={{ fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 700, letterSpacing: 'clamp(1px, 0.5vw, 3px)', color: '#999', paddingRight: 'clamp(30px, 5vw, 60px)' }}>
                <Sparkle size={10} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'clamp(6px, 1vw, 12px)' }} />{t}
              </span>
            ))
          )}
        </div>
      </motion.div>

      {/* ─── CTA CARDS ─── */}
      <section style={{
        padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)',
        background: 'transparent',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(20px, 4vw, 32px)' }}>
            {/* Predesigned Cases Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: CARD_SURFACE,
                border: '1px solid rgba(0,0,0,0.04)',
                borderRadius: 16,
                padding: 'clamp(32px, 6vw, 48px)',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Sparkles size={40} strokeWidth={1.5} /></div>
              <h3 style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, marginBottom: 12, color: '#000' }}>
                Predesigned Cases
              </h3>
              <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                Explore our curated collection of stunning predesigned cases. Ready to ship, instantly stylish.
              </p>
              <Link href="/predesigned">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 28px)',
                    borderRadius: 8,
                    fontSize: 'clamp(11px, 2vw, 13px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: 0.5,
                  }}
                >
                  Browse Predesigned →
                </motion.button>
              </Link>
            </motion.div>

            {/* Design Custom Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                background: CARD_SURFACE,
                border: '1px solid rgba(0,0,0,0.04)',
                borderRadius: 16,
                padding: 'clamp(32px, 6vw, 48px)',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Palette size={40} strokeWidth={1.5} /></div>
              <h3 style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, marginBottom: 12, color: '#000' }}>
                Design Custom
              </h3>
              <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                Create your own unique case. Upload photos, designs, or choose from 1000+ prints.
              </p>
              <Link href="/custom-case">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 28px)',
                    borderRadius: 8,
                    fontSize: 'clamp(11px, 2vw, 13px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: 0.5,
                  }}
                >
                  Start Designing →
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─── FEATURED PREDESIGNED ─── */}
      <section style={{
        padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)',
        background: 'transparent',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}
          >
            <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#999', fontWeight: 600, letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>
              READY TO SHIP
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', color: '#000', margin: 0 }}>
              Featured Designs
            </h2>
          </motion.div>
          <PredesignedProductGallery featuredOnly limit={8} showViewAll />
        </div>
      </section>

      {/* ─── SHOP BY TYPE ─── */}
      {productTypes.length > 0 && (
        <section style={{
          padding: 'clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)',
          background: 'transparent',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ marginBottom: 'clamp(48px, 8vw, 60px)' }}
            >
              <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#999', fontWeight: '500', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
                COLLECTIONS
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-1.5px', color: '#000' }}>
                Shop by Type
              </h2>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'clamp(16px, 3vw, 24px)' }} className="home-grid-shop-type">
              {visibleTypes.map((type, i) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Link href={`/predesigned?type=${type.slug}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        padding: 'clamp(24px, 4vw, 32px)',
                        background: 'transparent',
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 20px 25px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.background = CARD_SURFACE_HOVER;
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontSize: 'clamp(15px, 3vw, 17px)', fontWeight: '700', color: '#000', marginBottom: '8px' }}>{type.name}</div>
                      {type.description && (
                        <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#666', lineHeight: '1.6' }}>{type.description}</div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {hasMoreTypes && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                style={{ textAlign: 'center', marginTop: 'clamp(24px, 4vw, 32px)' }}
              >
                <button
                  onClick={() => setShowAllTypes(!showAllTypes)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: '2px solid #000',
                    background: 'transparent',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
                >
                  {showAllTypes ? 'Show Less' : `Show All ${productTypes.length} Types`}
                  <svg className={`w-4 h-4 transition-transform ${showAllTypes ? 'rotate-180' : ''}`} style={{ transform: showAllTypes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ─── BESTSELLERS ─── */}
      <section style={{ padding: 'clamp(30px, 6vw, 40px) clamp(20px, 5vw, 40px) clamp(80px, 12vw, 120px)', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div style={{ fontSize: 12, color: '#999', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            BESTSELLERS
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, color: '#000' }}>
            Cases Everyone&apos;s<br />
            <span style={{ background: 'linear-gradient(135deg, #000, #666)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Talking About
            </span>
          </h2>
        </motion.div>

        <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
          {featuredProducts.slice(0, 8).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              delay={i * 0.08}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: 60 }}>
          <Link href="/predesigned">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'transparent', border: '2px solid #000', color: '#000',
                padding: '12px 32px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.3s',
              }}
            >View All Products →</motion.button>
          </Link>
        </motion.div>


      </section>

      {/* ─── SHOP BY BRAND ─── */}
      <section style={{
        padding: '80px 40px',
        background: 'transparent',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 48 }}
          >
            <div style={{ fontSize: 12, color: '#999', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
              SHOP BY BRAND
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1, color: '#000' }}>
              Explore Our Partners
            </h2>
          </motion.div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {brands.map((brand, i) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={`/products?brand=${brand.slug}`}
                  style={{
                    background: CARD_SURFACE,
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    color: '#666',
                    padding: '12px 28px',
                    borderRadius: 50,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    letterSpacing: 0.5,
                    display: 'inline-block',
                    cursor: 'pointer',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #000, #333)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.color = '#666';
                    e.currentTarget.style.background = CARD_SURFACE;
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >{brand.name}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{
        padding: 'clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)',
        background: 'transparent',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="home-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(16px, 3vw, 20px)' }}>
            <StatCard value={50000} suffix="+" label="Cases Sold" delay={0} />
            <StatCard value={98} suffix="%" label="Happy Customers" delay={0.1} />
            <StatCard value={200} suffix="+" label="Phone Models" delay={0.2} />
            <StatCard value={30} suffix=" Day" label="Money-Back Guarantee" delay={0.3} />
          </div>
        </div>
      </section>


      {/* ─── TESTIMONIALS ─── */}
      <section style={{
        padding: '100px 40px',
        background: 'transparent',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '60px' }}
          >
            <div style={{ fontSize: '12px', color: '#999', fontWeight: '500', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
              CUSTOMER LOVE
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-1.5px', color: '#000' }}>
              What People Say
            </h2>
          </motion.div>

          <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <AnimatedTestimonial
              quote="The quality is insane. Felt premium the moment I unboxed it. Highly recommend!"
              author="Sarah Chen"
              role="Product Designer"
              index={0}
            />
            <AnimatedTestimonial
              quote="Dropped it on concrete twice. Still pristine. This thing actually works."
              author="James Rodriguez"
              role="Photographer"
              index={1}
            />
            <AnimatedTestimonial
              quote="Customization process was so easy. Arrived in 2 days, exceeded my expectations."
              author="Emily Watson"
              role="Creative Director"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{
        padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 40px)',
        background: 'transparent',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 'clamp(48px, 8vw, 80px)', textAlign: 'center' }}
          >
            <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#999', fontWeight: '500', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
              SIMPLE PROCESS
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-1.5px', color: '#000' }}>
              How It Works
            </h2>
            <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: '#666', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>
              From inspiration to protection in just a few clicks
            </p>
          </motion.div>

          <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
            {[
              { step: '1', title: 'Choose Model', desc: 'Select your phone model from our extensive catalog' },
              { step: '2', title: 'Pick Design', desc: 'Browse predesigned or upload your own artwork' },
              { step: '3', title: 'Customize', desc: 'Adjust colors, materials, and finishes to perfection' },
              { step: '4', title: 'Order & Enjoy', desc: 'We print and ship within 48 hours' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  padding: 'clamp(28px, 5vw, 40px)',
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.04)',
                  borderRadius: '16px',
                  textAlign: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 'clamp(48px, 10vw, 60px)',
                  height: 'clamp(48px, 10vw, 60px)',
                  background: 'linear-gradient(135deg, #000, #333)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 'clamp(20px, 5vw, 28px)',
                  fontWeight: 900,
                  margin: '0 auto clamp(16px, 3vw, 24px)',
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '700', color: '#000', marginBottom: '12px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#666', lineHeight: '1.6' }}>
                  {item.desc}
                </p>
                {i < 3 && (
                  <div style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 24,
                    color: '#ddd',
                    display: 'none',
                  }}>
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── CTA ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          padding: '120px 40px',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          background: 'transparent',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}><Sparkles size={56} strokeWidth={1.5} /></div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1.1,
              marginBottom: 24,
              background: 'linear-gradient(135deg, #000, #666)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Make It<br />100% Yours
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{ fontSize: 18, color: '#666', lineHeight: 1.7, marginBottom: 48 }}
          >
            Upload your art, pick your finish, choose your model. We&apos;ll print and ship it straight to your door in 48 hours.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href="/custom-case">
              <motion.button
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.92 }}
                style={{
                  background: 'linear-gradient(135deg, #000, #333)',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 40px',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}
              >
                Start Designing Now →
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── FOOTER ─── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        style={{
          padding: '60px 40px',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          background: 'transparent',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            className="home-grid-footer"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '60px',
              marginBottom: '60px',
            }}
          >
            {[
              { title: 'PRODUCT', links: ['Shop', 'Custom Cases', 'Collections'] },
              { title: 'COMPANY', links: ['About', 'Blog', 'Careers'] },
              { title: 'LEGAL', links: ['Privacy', 'Terms', 'Returns'] },
              { title: 'CONNECT', links: ['Twitter', 'Instagram', 'Discord'] },
            ].map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '20px', color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {col.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {col.links.map((link) => (
                    <motion.a
                      key={link}
                      href="#"
                      whileHover={{ color: '#000', x: 4 }}
                      style={{
                        color: '#999',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {link}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              paddingTop: '40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#000' }}>CaseStudio</div>
              <div style={{ fontSize: '12px', color: '#999' }}>Premium protection. Personal expression.</div>
            </div>
            <div style={{ fontSize: '12px', color: '#ccc' }}>© 2025 CaseStudio. All rights reserved.</div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}