/**
 * Customization Editor Component
 *
 * Uses react-rnd (Resizable and Draggable) to allow users to:
 *   1. Upload a custom image overlay on the case mockup.
 *   2. Add editable text elements.
 *   3. Resize, drag and position elements within the canvas bounds.
 *
 * Mobile fix: react-rnd internally uses interact.js / mouse events.
 * For touch support we must set `enableUserSelectHack={false}` AND
 * ensure the outer container does NOT intercept touch scroll. We also
 * add CSS `touch-action: none` on the canvas wrapper via a <style> tag
 * so the browser does not scroll-cancel pointer events inside it.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rnd } from 'react-rnd';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { useCart } from '@/src/context/CartContext';
import {
  ImagePlus,
  Type,
  Trash2,
  RotateCcw,
  Move,
  X,
  FlipHorizontal,
  Maximize,
  ZoomIn,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ImageElement {
  type: 'image';
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contrast?: number;
  brightness?: number;
  saturate?: number;
  flipX?: boolean;
}

interface TextElement {
  type: 'text';
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

type CanvasElement = ImageElement | TextElement;

interface CustomizationEditorProps {
  variantId: string;
  /** Background image – the phone case mockup */
  caseImageUrl?: string;
  /** Top overlay mask image - transparent PNG with camera cutout */
  maskImageUrl?: string;
  /** Optional product name shown above the editor */
  productName?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 560;

/** Scale a value from logical canvas space to display space */
const toDisplay = (v: number, scale: number) => v * scale;
/** Scale a value from display space back to logical canvas space */
const toLogical = (v: number, scale: number) => v / scale;

const FONT_OPTIONS = [
  'Inter, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Comic Sans MS, cursive',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CustomizationEditor({
  variantId,
  caseImageUrl,
  maskImageUrl,
  productName,
}: CustomizationEditorProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responsive canvas scale — we keep the internal coordinate space fixed
  // at 340×560 but visually scale the whole canvas on small screens.
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientWidth;
        setScale(Math.min(1, available / CANVAS_WIDTH));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [newText, setNewText] = useState('Your text');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [newFontSize, setNewFontSize] = useState(20);
  const [newFontFamily, setNewFontFamily] = useState(FONT_OPTIONS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- helpers ----

  const genId = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const updateElement = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setElements((prev) =>
        prev.map((el) =>
          el.id === id ? ({ ...el, ...patch } as CanvasElement) : el
        )
      );
    },
    []
  );

  const removeElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
  }, []);

  // ---- image upload ----

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxW = CANVAS_WIDTH * 0.6;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;

        const newEl: ImageElement = {
          type: 'image',
          id: genId(),
          src,
          x: (CANVAS_WIDTH - w) / 2,
          y: (CANVAS_HEIGHT - h) / 2,
          width: w,
          height: h,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ---- text add ----

  const handleAddText = () => {
    const newEl: TextElement = {
      type: 'text',
      id: genId(),
      content: newText || 'Your text',
      x: CANVAS_WIDTH / 2 - 60,
      y: CANVAS_HEIGHT / 2 - 16,
      width: 160,
      height: 40,
      fontSize: newFontSize,
      color: newTextColor,
      fontFamily: newFontFamily,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setShowTextPanel(false);
  };

  // ---- clear all ----

  const handleClear = () => {
    setElements([]);
    setSelectedId(null);
  };

  const handleTransform = () => {
    if (selectedElement?.type === 'image') {
      updateElement(selectedElement.id, { flipX: !selectedElement.flipX });
    }
  };

  const handlePosition = () => {
    if (selectedElement) {
      updateElement(selectedElement.id, {
        x: (CANVAS_WIDTH - selectedElement.width) / 2,
        y: (CANVAS_HEIGHT - selectedElement.height) / 2,
      });
    }
  };

  const handleReset = () => {
    if (selectedElement?.type === 'image') {
      updateElement(selectedElement.id, {
        contrast: 100,
        brightness: 100,
        saturate: 100,
        flipX: false,
      });
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Scaled canvas visual dimensions
  const scaledW = CANVAS_WIDTH * scale;
  const scaledH = CANVAS_HEIGHT * scale;

  return (
    <>
      {/*
        Global style: prevent the browser from stealing touch events inside
        the canvas. Without this, scrolling the page intercepts the drag.
      */}
      <style>{`
        #customization-canvas-wrapper {
          touch-action: none;
          -webkit-user-select: none;
          user-select: none;
        }
        #customization-canvas-wrapper * {
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ========== Canvas ========== */}
        <div className="flex-shrink-0 flex flex-col items-center w-full lg:w-auto">
          {productName && (
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{productName}</h3>
          )}

          {/* Top Floating Action */}
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              onClick={() => setShowTextPanel(true)}
              className="gap-2 font-bold text-gray-700 hover:text-black hover:bg-gray-100"
            >
              <Type className="w-5 h-5" />
              ADD TEXT
            </Button>
          </div>

          {/*
            Outer ref container: measures available width so we can compute
            `scale`. The canvas renders at scaledW × scaledH — no CSS
            transform is used, so react-rnd coordinate math stays correct
            on all screen sizes including mobile touch.
          */}
          <div ref={containerRef} className="w-full flex justify-center">
            <div
              id="customization-canvas-wrapper"
              style={{ width: scaledW, height: scaledH }}
            >
              <div
                id="customization-canvas"
                className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200 bg-gray-100"
                style={{ width: scaledW, height: scaledH }}
                onPointerDown={(e) => {
                  // Deselect when tapping the bare canvas (not an element)
                  if (e.target === e.currentTarget) {
                    setSelectedId(null);
                  }
                }}
              >
                {/* Layer 1: Case mockup background */}
                {caseImageUrl ? (
                  <img
                    src={caseImageUrl}
                    alt="Case mockup"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 z-0">
                    <span className="text-7xl opacity-30">📱</span>
                  </div>
                )}

                {/* Layer 3: Transparent Mask Overlay */}
                {(maskImageUrl || caseImageUrl) && (
                  <img
                    src={maskImageUrl || caseImageUrl}
                    alt="Case overlay mask"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30 drop-shadow-sm"
                    style={{ mixBlendMode: maskImageUrl ? 'normal' : 'multiply' }}
                    draggable={false}
                  />
                )}

                {/* Layer 2: Editable elements
                    All positions/sizes are stored in logical (340×560) space
                    and converted to display space via `scale` before passing
                    to Rnd. Callbacks convert back to logical space so the
                    stored values are always scale-independent.
                */}
                {elements.map((el) => (
                  <Rnd
                    key={el.id}
                    size={{
                      width: toDisplay(el.width, scale),
                      height: toDisplay(el.height, scale),
                    }}
                    position={{
                      x: toDisplay(el.x, scale),
                      y: toDisplay(el.y, scale),
                    }}
                    bounds="parent"
                    lockAspectRatio={el.type === 'image'}
                    enableUserSelectHack={false}
                    cancel=""
                    onPointerDown={(e: React.PointerEvent) => {
                      e.stopPropagation();
                      setSelectedId((prev) => (prev === el.id ? null : el.id));
                    }}
                    onDragStart={() => {
                      setSelectedId(el.id);
                    }}
                    onDrag={(_e: unknown, d: { x: number; y: number }) => {
                      updateElement(el.id, {
                        x: toLogical(d.x, scale),
                        y: toLogical(d.y, scale),
                      });
                    }}
                    onDragStop={(_e: unknown, d: { x: number; y: number }) => {
                      updateElement(el.id, {
                        x: toLogical(d.x, scale),
                        y: toLogical(d.y, scale),
                      });
                    }}
                    onResize={(
                      _e: unknown,
                      _direction: unknown,
                      ref: HTMLElement,
                      _delta: unknown,
                      position: { x: number; y: number }
                    ) => {
                      updateElement(el.id, {
                        width: toLogical(parseFloat(ref.style.width), scale),
                        height: toLogical(parseFloat(ref.style.height), scale),
                        x: toLogical(position.x, scale),
                        y: toLogical(position.y, scale),
                      });
                    }}
                    onResizeStop={(
                      _e: unknown,
                      _direction: unknown,
                      ref: HTMLElement,
                      _delta: unknown,
                      position: { x: number; y: number }
                    ) => {
                      updateElement(el.id, {
                        width: toLogical(parseFloat(ref.style.width), scale),
                        height: toLogical(parseFloat(ref.style.height), scale),
                        x: toLogical(position.x, scale),
                        y: toLogical(position.y, scale),
                      });
                    }}
                    className={
                      selectedId === el.id
                        ? 'ring-2 ring-orange-500 ring-offset-1'
                        : ''
                    }
                    enableResizing={selectedId === el.id}
                    style={{
                      zIndex: selectedId === el.id ? 20 : 10,
                      touchAction: 'none',
                      cursor: 'move',
                    }}
                    resizeHandleComponent={
                      selectedId === el.id
                        ? {
                            bottomRight: <ResizeHandle />,
                            bottomLeft: <ResizeHandle />,
                            topRight: <ResizeHandle />,
                            topLeft: <ResizeHandle />,
                          }
                        : {}
                    }
                  >
                    {el.type === 'image' ? (
                      <img
                        src={el.src}
                        alt="Custom upload"
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                        style={{
                          filter: `contrast(${el.contrast ?? 100}%) brightness(${el.brightness ?? 100}%) saturate(${el.saturate ?? 100}%)`,
                          transform: el.flipX ? 'scaleX(-1)' : 'scaleX(1)',
                          touchAction: 'none',
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center select-none"
                        style={{
                          // Scale font size proportionally so text looks the
                          // same relative to the canvas on all screen sizes.
                          fontSize: `${toDisplay(el.fontSize, scale)}px`,
                          color: el.color,
                          fontFamily: el.fontFamily,
                          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                          wordBreak: 'break-word',
                          lineHeight: 1.2,
                          touchAction: 'none',
                          pointerEvents: 'none',
                        }}
                      >
                        {el.content}
                      </div>
                    )}
                  </Rnd>
                ))}

                {/* Empty state hint */}
                {elements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Move className="w-8 h-8 text-white/50 mb-2" />
                    <p className="text-white/60 text-sm font-medium text-center px-8">
                      Add images or text using the tools panel
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Floating Toolbar */}
          {selectedId && selectedElement && (
            <div className="mt-4 flex flex-col items-center gap-2 w-full">
              {/* Size slider row */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-3 w-full max-w-xs">
                <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(
                    (selectedElement.width / CANVAS_WIDTH) * 100
                  )}
                  onChange={(e) => {
                    const pct = Number(e.target.value) / 100;
                    const newW = CANVAS_WIDTH * pct;
                    if (selectedElement.type === 'image') {
                      // keep aspect ratio
                      const ratio = selectedElement.width / selectedElement.height;
                      const newH = newW / ratio;
                      updateElement(selectedElement.id, {
                        width: newW,
                        height: newH,
                        x: Math.max(0, Math.min(CANVAS_WIDTH - newW, selectedElement.x)),
                        y: Math.max(0, Math.min(CANVAS_HEIGHT - newH, selectedElement.y)),
                      });
                    } else {
                      updateElement(selectedElement.id, {
                        width: newW,
                        x: Math.max(0, Math.min(CANVAS_WIDTH - newW, selectedElement.x)),
                      });
                    }
                  }}
                  className="flex-1 accent-orange-500 h-1.5"
                  style={{ touchAction: 'none' }}
                />
                <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
                  {Math.round((selectedElement.width / CANVAS_WIDTH) * 100)}%
                </span>
              </div>

              {/* Action buttons row */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 sm:px-6 py-3 flex flex-wrap gap-4 sm:gap-8 items-center justify-center z-50">
                <ToolbarButton icon={<FlipHorizontal className="w-5 h-5" />} label="Transform" onClick={handleTransform} />
                <ToolbarButton icon={<Maximize className="w-5 h-5" />} label="Position" onClick={handlePosition} />
                <ToolbarButton icon={<RotateCcw className="w-5 h-5" />} label="Reset" onClick={handleReset} />
                <ToolbarButton
                  icon={<Trash2 className="w-5 h-5" />}
                  label="Remove"
                  onClick={() => removeElement(selectedId)}
                  danger
                />
              </div>
            </div>
          )}
        </div>

        {/* ========== Tools Panel ========== */}
        <div className="flex-1 min-w-[280px] space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Design Tools</h3>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 gap-2 border-dashed border-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4" />
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <Button
              variant="outline"
              className="h-12 gap-2 border-dashed border-2"
              onClick={() => setShowTextPanel(!showTextPanel)}
            >
              <Type className="w-4 h-4" />
              Add Text
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 text-red-600 hover:text-red-700"
              onClick={handleClear}
              disabled={elements.length === 0}
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </Button>

            {selectedId && (
              <Button
                variant="outline"
                className="h-12 gap-2 text-red-600 hover:text-red-700"
                onClick={() => removeElement(selectedId)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            )}
          </div>

          {/* Text creation panel */}
          {showTextPanel && (
            <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">New Text</h4>
                <button onClick={() => setShowTextPanel(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-content">Text</Label>
                <Input
                  id="text-content"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter your text"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="text-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={newTextColor}
                      onChange={(e) => setNewTextColor(e.target.value)}
                      className="h-10 w-12 p-1"
                    />
                    <Input
                      type="text"
                      value={newTextColor}
                      onChange={(e) => setNewTextColor(e.target.value)}
                      className="h-10 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-size">Size ({newFontSize}px)</Label>
                  <input
                    id="text-size"
                    type="range"
                    min={10}
                    max={60}
                    value={newFontSize}
                    onChange={(e) => setNewFontSize(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-font">Font</Label>
                <select
                  id="text-font"
                  value={newFontFamily}
                  onChange={(e) => setNewFontFamily(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <Button className="w-full h-10 bg-orange-600 hover:bg-orange-700" onClick={handleAddText}>
                Add to Canvas
              </Button>
            </div>
          )}

          {/* Selected Image properties */}
          {selectedElement?.type === 'image' && (
            <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
              <h4 className="font-semibold text-gray-900">Image Adjustments</h4>

              {(
                [
                  { key: 'contrast', label: 'Contrast' },
                  { key: 'brightness', label: 'Brightness' },
                  { key: 'saturate', label: 'Saturation' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{label}</Label>
                    <span className="text-xs text-gray-500">
                      {(selectedElement as ImageElement)[key] ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={(selectedElement as ImageElement)[key] ?? 100}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { [key]: Number(e.target.value) })
                    }
                    className="w-full accent-orange-600"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Selected text properties */}
          {selectedElement?.type === 'text' && (
            <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
              <h4 className="font-semibold text-gray-900">Edit Text</h4>

              <div className="space-y-2">
                <Label>Content</Label>
                <Input
                  value={selectedElement.content}
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                    className="h-10 w-full p-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Size ({selectedElement.fontSize}px)</Label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={selectedElement.fontSize}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                    }
                    className="w-full mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Layer list */}
          {elements.length > 0 && (
            <div className="border rounded-xl p-4 bg-white shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">Layers ({elements.length})</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {elements.map((el, idx) => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      selectedId === el.id
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {el.type === 'image' ? (
                        <ImagePlus className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <Type className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {el.type === 'text' ? el.content : `Image ${idx + 1}`}
                      </span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(el.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase & Add to Cart Actions */}
          <div className="border rounded-xl p-4 bg-orange-50/50 border-orange-100 space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Finish Your Design</h4>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    await addToCart(variantId, undefined, 1, { elements });
                  } catch {
                    setError('Failed to add custom design to cart. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Saving Design...' : '🛒 Add Custom Case to Cart'}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold rounded-lg"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    await addToCart(variantId, undefined, 1, { elements });
                    router.push('/cart');
                  } catch {
                    setError('Failed to complete purchase. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processing...' : '⚡ Buy Custom Case Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Small reusable sub-components                                      */
/* ------------------------------------------------------------------ */

function ResizeHandle() {
  return (
    <div
      style={{ touchAction: 'none' }}
      className="w-8 h-8 bg-white border-4 border-orange-500 rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2"
    />
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${
        danger
          ? 'text-gray-700 hover:text-red-600'
          : 'text-gray-700 hover:text-orange-600'
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}