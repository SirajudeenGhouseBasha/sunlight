'use client';

import { useState, useEffect, useRef, RefObject, MouseEvent } from 'react';
import Link from 'next/link';
import { MainNav } from '@/src/components/navigation/MainNav';
import { useCart } from '@/src/context/CartContext';

// ─── Prop types (unchanged from your original) ────────────────────────────────

interface Product {
  id: string;
  variant_id: string;
  name: string;
  product_type: string;
  color_name: string;
  color_hex?: string;
  price: number;
  in_stock: boolean;
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

function useInView(threshold: number = 0.2): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState<boolean>(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PhoneMockupProps {
  color?: string;
  label?: string;
  delay?: number;
  scale?: number;
}

function PhoneMockup({ color = '#FF6B35', label, delay = 0, scale = 1 }: PhoneMockupProps) {
  return (
    <div style={{
      transform: `scale(${scale})`,
      animation: `floatPhone 4s ease-in-out ${delay}s infinite`,
    }}>
      <div style={{
        width: 80, height: 140,
        background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: 16,
        border: '2px solid #333',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px #444',
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
          width: 24, height: 3, background: '#555', borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', top: 10, left: '50%',
          transform: 'translateX(-50%)',
          width: 20, height: 4, background: '#333', borderRadius: 10,
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
  accentColor: string;
  delay: number;
  onAddToCart: (variantId: string) => void;
}

function ProductCard({ product, accentColor, delay, onAddToCart }: ProductCardProps) {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState<boolean>(false);
  const cardColor = product.color_hex ?? accentColor;

  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(40px)',
      transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered
            ? 'linear-gradient(135deg, #1e1e1e, #252525)'
            : 'linear-gradient(135deg, #161616, #1c1c1c)',
          border: `1px solid ${hovered ? accentColor + '66' : '#2a2a2a'}`,
          borderRadius: 20,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: hovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: hovered ? `0 30px 60px rgba(0,0,0,0.4), 0 0 30px ${accentColor}22` : 'none',
        }}
      >
        <Link href={`/products/${product.variant_id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            height: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle at 50% 60%, ${cardColor}18 0%, transparent 70%)`,
            position: 'relative',
          }}>
            <div style={{
              width: 80, height: 130,
              background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
              borderRadius: 14,
              border: `2px solid ${cardColor}88`,
              boxShadow: `0 0 30px ${cardColor}44, inset 0 0 20px ${cardColor}11`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${cardColor}22, transparent)`,
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
            background: `${accentColor}22`, color: accentColor,
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            padding: '4px 10px', borderRadius: 20, marginBottom: 10,
            border: `1px solid ${accentColor}44`,
          }}>{product.product_type}</div>

          <Link href={`/products/${product.variant_id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              fontSize: 15, fontWeight: 600, color: '#e5e5e5',
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
                background: product.color_hex, border: '1px solid #444',
              }} />
            )}
            <span style={{ fontSize: 12, color: '#555' }}>{product.color_name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              ${product.price.toFixed(2)}
            </span>
            <button
              onClick={() => onAddToCart(product.variant_id)}
              disabled={!product.in_stock}
              style={{
                background: hovered && product.in_stock ? accentColor : 'transparent',
                border: `1px solid ${product.in_stock ? accentColor : '#444'}`,
                color: hovered && product.in_stock ? '#000' : (product.in_stock ? accentColor : '#555'),
                padding: '8px 18px', borderRadius: 30,
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                cursor: product.in_stock ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                opacity: product.in_stock ? 1 : 0.5,
              }}
            >{product.in_stock ? 'ADD TO CART' : 'SOLD OUT'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  value: number;
  suffix: string;
  label: string;
  color: string;
  delay: number;
}

function StatCard({ value, suffix, label, color, delay }: StatCardProps) {
  const [ref, inView] = useInView();
  const count = useCounter(value, 2000, inView);
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'scale(1)' : 'scale(0.8)',
      transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      textAlign: 'center', padding: '32px 20px',
      background: `linear-gradient(135deg, ${color}11, ${color}06)`,
      border: `1px solid ${color}33`, borderRadius: 20,
    }}>
      <div style={{
        fontSize: 48, fontWeight: 900, lineHeight: 1, marginBottom: 8,
        background: `linear-gradient(135deg, #fff, ${color})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: '#888', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
  index: number;
}

function FeatureCard({ icon, title, desc, color, index }: FeatureCardProps) {
  const [ref, inView] = useInView(0.1);
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(30px)',
      transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
      display: 'flex', gap: 24, alignItems: 'flex-start',
      padding: 32, background: '#111',
      border: '1px solid #1e1e1e', borderRadius: 20,
    }}>
      <div style={{
        width: 56, height: 56, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}33`,
        borderRadius: 16, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 24,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e5e5e5', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_COLORS = ['#FF6B35', '#00D4FF', '#A855F7', '#22D3EE', '#F59E0B', '#34D399'];

const FEATURES: { icon: string; title: string; desc: string; color: string }[] = [
  { icon: '🛡️', title: 'Military-Grade Protection',  color: '#FF6B35', desc: "Drop-tested from 6 feet on all sides. Our cases absorb impact so your phone doesn't." },
  { icon: '🎨', title: 'Unlimited Customization',    color: '#00D4FF', desc: 'Upload your photos, designs, or choose from 1000+ exclusive prints.' },
  { icon: '⚡', title: '48-Hour Delivery',           color: '#A855F7', desc: 'Printed and shipped within 24 hours. Get your case before you forget you ordered it.' },
  { icon: '♻️', title: 'Sustainably Made',           color: '#22D3EE', desc: 'Eco-friendly materials and packaging. Protection for your phone and the planet.' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function HomePageClient({ featuredProducts, brands, productTypes }: HomePageClientProps) {
  const { addToCart } = useCart();
  const [heroVisible, setHeroVisible] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

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
    }
  };

  return (
    <div style={{
      background: '#0a0a0a', color: '#fff',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      overflowX: 'hidden', minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px #FF6B3544; }
          50%       { box-shadow: 0 0 60px #FF6B3588; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <MainNav />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 40px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, #FF6B3518 0%, transparent 60%)`,
          transition: 'background 0.3s ease',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 80, alignItems: 'center',
        }}>
          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FF6B3522', border: '1px solid #FF6B3544',
              borderRadius: 30, padding: '6px 16px', marginBottom: 32,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
            }}>
              <div style={{ width: 6, height: 6, background: '#FF6B35', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, color: '#FF6B35', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                New Collection 2025
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(48px, 5vw, 76px)', fontWeight: 900,
              lineHeight: 1.05, letterSpacing: -2, marginBottom: 24,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            }}>
              Your Phone,<br />
              <span style={{
                background: 'linear-gradient(135deg, #FF6B35, #FF9F6B)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Your Canvas.</span>
            </h1>

            <p style={{
              fontSize: 18, color: '#888', lineHeight: 1.7,
              maxWidth: 440, marginBottom: 48,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.35s',
            }}>
              Premium protection meets personal style. Drop-tested, scratch-proof, and designed to turn heads wherever you go.
            </p>

            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
            }}>
              <Link href="/products">
                <button
                  style={{
                    background: '#FF6B35', border: 'none', color: '#fff',
                    padding: '16px 36px', borderRadius: 50,
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    letterSpacing: 0.5, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    animation: 'glowPulse 3s ease infinite',
                  }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'none'; }}
                >Shop Now →</button>
              </Link>
              <Link href="/custom-case">
                <button
                  style={{
                    background: 'transparent', border: '1px solid #333', color: '#fff',
                    padding: '16px 36px', borderRadius: 50,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    letterSpacing: 0.5, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'none'; }}
                >✨ Design Custom</button>
              </Link>
            </div>

            <div style={{
              display: 'flex', gap: 32, marginTop: 56,
              opacity: heroVisible ? 1 : 0,
              transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.65s',
            }}>
              {(['🛡️ Military grade', '🚚 Free shipping', '↩️ 30-day returns'] as const).map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', fontWeight: 500 }}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — phones */}
          <div style={{
            position: 'relative', height: 480,
            opacity: heroVisible ? 1 : 0,
            transition: 'opacity 1.2s ease 0.4s',
          }}>
            <div style={{ position: 'absolute', top: 60,   left: '50%', transform: 'translateX(-50%)' }}><PhoneMockup color="#FF6B35" label="SHIELD" delay={0}   scale={1.4} /></div>
            <div style={{ position: 'absolute', top: 20,   left: '15%' }}                                ><PhoneMockup color="#00D4FF" label="ULTRA"  delay={0.5} scale={1.0} /></div>
            <div style={{ position: 'absolute', top: 100,  right: '10%' }}                               ><PhoneMockup color="#A855F7" label="LUXE"   delay={1.0} scale={1.1} /></div>
            <div style={{ position: 'absolute', bottom: 40, left: '25%' }}                               ><PhoneMockup color="#22D3EE" label="NANO"   delay={1.5} scale={0.9} /></div>
            <div style={{ position: 'absolute', bottom: 60, right: '20%' }}                              ><PhoneMockup color="#F59E0B" label="ECO"    delay={2.0} scale={0.85} /></div>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 320, height: 320, marginLeft: -160, marginTop: -160,
              border: '1px dashed #FF6B3522', borderRadius: '50%',
              animation: 'spin 20s linear infinite', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 200, height: 200, marginLeft: -100, marginTop: -100,
              border: '1px dashed #00D4FF11', borderRadius: '50%',
              animation: 'spin 12s linear infinite reverse', pointerEvents: 'none',
            }} />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{
        overflow: 'hidden', borderTop: '1px solid #1a1a1a',
        borderBottom: '1px solid #1a1a1a', padding: '18px 0', background: '#111',
      }}>
        <div style={{ display: 'flex', animation: 'marquee 25s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...Array(4)].flatMap((_, ai) =>
            ['PREMIUM QUALITY', 'CUSTOM DESIGNS', 'FREE SHIPPING', 'DROP PROTECTED', 'PERFECT FIT', '30-DAY RETURNS'].map((t) => (
              <span key={`${ai}-${t}`} style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: '#444', paddingRight: 60 }}>
                <span style={{ color: '#FF6B35', marginRight: 12 }}>✦</span>{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <StatCard value={50000} suffix="+"    label="Cases Sold"            color="#FF6B35" delay={0}   />
          <StatCard value={98}    suffix="%"    label="Happy Customers"       color="#22D3EE" delay={0.1} />
          <StatCard value={200}   suffix="+"    label="Phone Models"          color="#A855F7" delay={0.2} />
          <StatCard value={30}    suffix=" Day" label="Money-Back Guarantee"  color="#F59E0B" delay={0.3} />
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section style={{ padding: '20px 40px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 12, color: '#FF6B35', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            BESTSELLERS
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1 }}>
            Cases Everyone&apos;s<br />
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Talking About
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {featuredProducts.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
              delay={i * 0.1}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href="/products">
            <button
              style={{
                background: 'transparent', border: '1px solid #333', color: '#fff',
                padding: '14px 40px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.3s',
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.color = '#FF6B35'; }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; }}
            >View All Products →</button>
          </Link>
        </div>
      </section>

      {/* ── SHOP BY BRAND ── */}
      <section style={{ padding: '80px 40px', background: '#0e0e0e' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#555', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 48 }}>
            SHOP BY BRAND
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.slug}`}
                style={{
                  background: 'transparent', border: '1px solid #2a2a2a', color: '#666',
                  padding: '12px 28px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  letterSpacing: 0.5, display: 'inline-block',
                }}
                onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = '#FF6B3566'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'none'; }}
              >{brand.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOP BY TYPE ── */}
      {productTypes.length > 0 && (
        <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, color: '#FF6B35', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
              COLLECTIONS
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.5 }}>Shop by Type</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {productTypes.map((type, i) => {
              const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
              return (
                <Link key={type.id} href={`/products?type=${type.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ padding: 28, background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    onMouseEnter={(e: MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = `${color}66`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={(e: MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `${color}18`, border: `1px solid ${color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, marginBottom: 16,
                    }}>📱</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#e5e5e5', marginBottom: 8 }}>{type.name}</div>
                    {type.description && (
                      <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{type.description}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CUSTOM CTA ── */}
      <section style={{
        padding: '120px 40px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #ffffff05 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400,
          background: 'radial-gradient(ellipse, #FF6B3514, transparent 70%)', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: 'floatPhone 3s ease-in-out infinite' }}>✨</div>
          <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, marginBottom: 24 }}>
            Make It<br />
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F6B, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              100% Yours
            </span>
          </h2>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.7, marginBottom: 48 }}>
            Upload your art, pick your finish, choose your model. We&apos;ll print and ship it straight to your door in 48 hours.
          </p>
          <Link href="/custom-case">
            <button
              style={{
                background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
                border: 'none', color: '#fff', padding: '20px 56px', borderRadius: 60,
                fontSize: 16, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 20px 60px #FF6B3544',
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 30px 80px #FF6B3566'; }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 20px 60px #FF6B3544'; }}
            >Start Designing Now →</button>
          </Link>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section style={{ padding: '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, textAlign: 'center', marginBottom: 60 }}>
          Why CaseStudio?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 26, marginBottom: 12 }}>📱</div>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5, marginBottom: 8 }}>CaseStudio</div>
        <div style={{ fontSize: 14, color: '#444', marginBottom: 32 }}>Premium protection. Personal expression.</div>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 40 }}>
          {[
            { label: 'Products',   href: '/products' },
            { label: 'Customize',  href: '/custom-case' },
            { label: 'Orders',     href: '/orders' },
            { label: 'My Designs', href: '/dashboard/designs' },
          ].map(({ label, href }) => (
            <Link
              key={label} href={href}
              style={{ color: '#555', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#FF6B35'; }}
              onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#555'; }}
            >{label}</Link>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#333' }}>© 2025 CaseStudio. All rights reserved.</div>
      </footer>
    </div>
  );
}