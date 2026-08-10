/**
 * Customization Editor Component
 *
 * Lets users:
 *   1. Upload a custom image overlay on the case mockup.
 *   2. Add editable text elements.
 *   3. Drag, resize (corner handles) and pinch-to-zoom elements within
 *      the canvas.
 *
 * Rebuilt on native Pointer Events instead of react-rnd. Pointer Events
 * fire for both mouse and touch through the same handlers, and each touch
 * point carries its own pointerId — so a single element naturally supports
 * one-finger drag AND two-finger pinch without the two gestures fighting
 * each other, and without any react-rnd/interact.js touch-action hacks.
 *
 * All element geometry is stored in a fixed logical coordinate space
 * (CANVAS_WIDTH × CANVAS_HEIGHT) and converted to on-screen pixels via
 * `scale`, which is recomputed from the container's actual width. This
 * keeps drag/resize/pinch math identical at any screen size.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  aspect: number; // naturalW / naturalH — locked while resizing
  contrast?: number;
  brightness?: number;
  saturate?: number;
  flipX?: boolean;
  broken?: boolean; // set if the browser fails to decode/render src
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
const MIN_SIZE = 24;
const HANDLE_HIT_SIZE = 28; // display px, generous touch target

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

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientWidth;
        setScale(Math.min(1, available / CANVAS_WIDTH));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Belt-and-braces scroll lock for the canvas. CSS `touch-action: none`
  // (below) is enough on most browsers, but some Android WebViews/in-app
  // browsers still let a page scroll start before that CSS is honored.
  // A native, non-passive touchmove listener is the one technique that
  // reliably blocks scroll everywhere, because `{ passive: false }` can
  // only be set via addEventListener — React's synthetic onTouchMove is
  // attached passively for scroll performance and can't stop it.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const blockScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    node.addEventListener('touchmove', blockScroll, { passive: false });
    return () => node.removeEventListener('touchmove', blockScroll);
  }, []);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [newText, setNewText] = useState('Your text');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [newFontSize, setNewFontSize] = useState(20);
  const [newFontFamily, setNewFontFamily] = useState(FONT_OPTIONS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active pointers per element, keyed by pointerId, in display px relative
  // to the canvas. size 1 => drag. size >= 2 => pinch (uses first two ids).
  const pointersRef = useRef<Map<string, Map<number, { x: number; y: number }>>>(new Map());
  // Gesture snapshot taken when a drag/pinch begins, per element id.
  const gestureRef = useRef<
    Map<
      string,
      {
        mode: 'drag' | 'pinch';
        startX: number;
        startY: number;
        startW: number;
        startH: number;
        startClientX: number; // drag only, display px
        startClientY: number;
        startDist: number; // pinch only, display px
        centerX: number; // pinch only, logical
        centerY: number;
      }
    >
  >(new Map());

  const getPointers = (id: string) => {
    let m = pointersRef.current.get(id);
    if (!m) {
      m = new Map();
      pointersRef.current.set(id, m);
    }
    return m;
  };

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
    pointersRef.current.delete(id);
    gestureRef.current.delete(id);
  }, []);

  const clampPos = (x: number, y: number, w: number, h: number) => {
    // Allow a bit of overhang past the edges (natural for cover-fit crops)
    // but keep at least a quarter of the element over the canvas.
    const minX = -w * 0.75;
    const minY = -h * 0.75;
    const maxX = CANVAS_WIDTH - w * 0.25;
    const maxY = CANVAS_HEIGHT - h * 0.25;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // ---- image upload ----

  // Some phones (mostly Android photo pickers) hand over HEIC/HEIF files
  // with an empty or non-standard `type`. Most non-Safari browsers can't
  // decode HEIC in <img>/<canvas> at all, which otherwise surfaces as a
  // confusing generic failure — catch it explicitly with a clear message.
  const isLikelyHeic = (file: File) => {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    return type.includes('heic') || type.includes('heif') || /\.hei[cf]$/.test(name);
  };

  // Final encoded size cap (bytes, before base64). Large data URIs are the
  // most common reason an uploaded image renders on some devices and not
  // others: several mobile WebViews (in-app browsers especially) silently
  // fail to paint an <img src="data:..."> once it gets too big, with no
  // onerror firing. Re-encoding at a lower quality/size keeps this safely
  // under those limits on every device, not just the ones we've tested.
  const MAX_ENCODED_BYTES = 1.5 * 1024 * 1024;

  const blobToDataURL = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, mime, quality));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/') && !isLikelyHeic(file)) {
      setError('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }

    if (isLikelyHeic(file)) {
      setError('HEIC photos aren\u2019t supported on all devices yet. Please choose a JPG or PNG (in your Camera app, try "Share" \u2192 save as JPG, or change your camera format under Settings \u2192 Camera).');
      return;
    }

    setError(null);
    setUploading(true);

    // Use an object URL instead of FileReader/readAsDataURL for the initial
    // read — base64 of a raw phone photo is huge and some phones fail to
    // decode it silently. The image is normalized through a canvas (caps
    // the resolution) and re-encoded through canvas.toBlob (async, so it
    // doesn't block the main thread on low-power devices, unlike toDataURL).
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    };

    img.onload = async () => {
      try {
        const MAX_DIM = 1200;
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        if (!naturalW || !naturalH) {
          throw new Error('Could not determine image dimensions');
        }

        let w = naturalW;
        let h = naturalH;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas not supported');
        }
        ctx.drawImage(img, 0, 0, w, h);

        const isPng = file.type === 'image/png';
        let mime = isPng ? 'image/png' : 'image/jpeg';
        let blob = await canvasToBlob(canvas, mime, isPng ? undefined : 0.85);

        // Re-encode smaller/lossier until it's under the size cap, so the
        // final data URI stays reliably renderable everywhere. PNG has no
        // quality knob, so if it's still too big we fall back to JPEG.
        const qualitySteps = [0.6, 0.4];
        for (const q of qualitySteps) {
          if (!blob || blob.size <= MAX_ENCODED_BYTES) break;
          if (isPng) {
            mime = 'image/jpeg';
          }
          blob = await canvasToBlob(canvas, mime, q);
        }
        if (blob && blob.size > MAX_ENCODED_BYTES) {
          // Last resort: shrink the canvas itself and re-encode once more.
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(w * 0.6);
          smallCanvas.height = Math.round(h * 0.6);
          const sctx = smallCanvas.getContext('2d');
          if (sctx) {
            sctx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            blob = await canvasToBlob(smallCanvas, 'image/jpeg', 0.5);
          }
        }

        if (!blob) {
          throw new Error('Could not encode image');
        }

        const src = await blobToDataURL(blob);

        const maxW = CANVAS_WIDTH * 0.6;
        const elW = Math.min(w, maxW);
        const elH = elW * (h / w);

        const newEl: ImageElement = {
          type: 'image',
          id: genId(),
          src,
          x: (CANVAS_WIDTH - elW) / 2,
          y: (CANVAS_HEIGHT - elH) / 2,
          width: elW,
          height: elH,
          aspect: w / h,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
      } catch {
        setError('Could not process this image on your device. Please try a JPG or PNG photo.');
      } finally {
        cleanup();
      }
    };

    img.onerror = () => {
      cleanup();
      setError('Could not read this image on your device. Please try a JPG or PNG photo.');
    };

    img.src = objectUrl;
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
    pointersRef.current.clear();
    gestureRef.current.clear();
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

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

  /* ------------------------------------------------------------------ */
  /*  Drag + pinch, driven entirely by Pointer Events                    */
  /* ------------------------------------------------------------------ */

  const onElementPointerDown = useCallback(
    (el: CanvasElement) => (e: React.PointerEvent) => {
      // Corner handles have their own handler and stop propagation before
      // this ever fires, so anything reaching here is a body drag/pinch.
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setSelectedId(el.id);

      const pts = getPointers(el.id);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pts.size >= 2) {
        const [p1, p2] = Array.from(pts.values()).slice(0, 2);
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        gestureRef.current.set(el.id, {
          mode: 'pinch',
          startX: el.x,
          startY: el.y,
          startW: el.width,
          startH: el.height,
          startClientX: 0,
          startClientY: 0,
          startDist: dist,
          centerX: el.x + el.width / 2,
          centerY: el.y + el.height / 2,
        });
      } else {
        gestureRef.current.set(el.id, {
          mode: 'drag',
          startX: el.x,
          startY: el.y,
          startW: el.width,
          startH: el.height,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startDist: 0,
          centerX: 0,
          centerY: 0,
        });
      }
    },
    []
  );

  const onElementPointerMove = useCallback(
    (el: CanvasElement) => (e: React.PointerEvent) => {
      const pts = pointersRef.current.get(el.id);
      const g = gestureRef.current.get(el.id);
      if (!pts || !g || !pts.has(e.pointerId)) return;
      if (e.cancelable) e.preventDefault();
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (g.mode === 'drag' && pts.size === 1) {
        const dx = toLogical(e.clientX - g.startClientX, scale);
        const dy = toLogical(e.clientY - g.startClientY, scale);
        const pos = clampPos(g.startX + dx, g.startY + dy, el.width, el.height);
        updateElement(el.id, { x: pos.x, y: pos.y });
        return;
      }

      if (g.mode === 'pinch' && pts.size >= 2) {
        const [p1, p2] = Array.from(pts.values()).slice(0, 2);
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (g.startDist === 0) return;
        const ratio = dist / g.startDist;
        const aspect = el.type === 'image' ? el.aspect : g.startW / g.startH;
        const newW = Math.max(MIN_SIZE, toLogical(toDisplay(g.startW, scale) * ratio, scale));
        const newH = newW / aspect;
        const pos = clampPos(g.centerX - newW / 2, g.centerY - newH / 2, newW, newH);
        updateElement(el.id, { width: newW, height: newH, x: pos.x, y: pos.y });
      }
    },
    [scale, updateElement]
  );

  const onElementPointerUp = useCallback(
    (el: CanvasElement) => (e: React.PointerEvent) => {
      const pts = pointersRef.current.get(el.id);
      if (!pts) return;
      pts.delete(e.pointerId);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }

      if (pts.size === 1) {
        // Dropped from pinch to one finger — resume as a drag so the
        // remaining finger keeps moving the element with no jump.
        const [[, pos]] = Array.from(pts.entries());
        gestureRef.current.set(el.id, {
          mode: 'drag',
          startX: el.x,
          startY: el.y,
          startW: el.width,
          startH: el.height,
          startClientX: pos.x,
          startClientY: pos.y,
          startDist: 0,
          centerX: 0,
          centerY: 0,
        });
      } else if (pts.size === 0) {
        gestureRef.current.delete(el.id);
      }
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  Corner-handle resize (precise, mouse or touch, no pinch needed)    */
  /* ------------------------------------------------------------------ */

  const startHandleDrag = useCallback(
    (el: CanvasElement, corner: Corner) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const pointerId = e.pointerId;
      (e.currentTarget as Element).setPointerCapture(pointerId);

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startW = el.width;
      const startH = el.height;
      const startX = el.x;
      const startY = el.y;
      const lockAspect = el.type === 'image';
      const aspect = el.type === 'image' ? el.aspect : startW / startH;

      // The opposite corner is the fixed anchor.
      const anchor = {
        x: corner.includes('Left') ? startX + startW : startX,
        y: corner.includes('top') || corner === 'topLeft' || corner === 'topRight' ? startY + startH : startY,
      };
      const dirX = corner.includes('Left') ? -1 : 1;
      const dirY = corner === 'topLeft' || corner === 'topRight' ? -1 : 1;

      const move = (ev: PointerEvent) => {
        const dxLogical = toLogical(ev.clientX - startClientX, scale) * dirX;
        const newW = Math.max(MIN_SIZE, startW + dxLogical);
        let newH: number;

        if (lockAspect) {
          newH = newW / aspect;
        } else {
          const dyLogical = toLogical(ev.clientY - startClientY, scale) * dirY;
          newH = Math.max(MIN_SIZE, startH + dyLogical);
        }

        const newX = corner.includes('Left') ? anchor.x - newW : anchor.x;
        const newY = (corner === 'topLeft' || corner === 'topRight') ? anchor.y - newH : anchor.y;
        updateElement(el.id, { width: newW, height: newH, x: newX, y: newY });
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [scale, updateElement]
  );

  const scaledW = CANVAS_WIDTH * scale;
  const scaledH = CANVAS_HEIGHT * scale;

  const handleDefs: { corner: Corner; style: React.CSSProperties }[] = [
    { corner: 'topLeft', style: { top: 0, left: 0, cursor: 'nwse-resize' } },
    { corner: 'topRight', style: { top: 0, right: 0, cursor: 'nesw-resize' } },
    { corner: 'bottomLeft', style: { bottom: 0, left: 0, cursor: 'nesw-resize' } },
    { corner: 'bottomRight', style: { bottom: 0, right: 0, cursor: 'nwse-resize' } },
  ];

  return (
    <>
      {/*
        Prevent the browser from stealing touch events inside the canvas —
        without this, scrolling the page intercepts drag/pinch.
      */}
      <style>{`
        #customization-canvas-wrapper,
        #customization-canvas-wrapper * {
          touch-action: none;
          -webkit-user-select: none;
          user-select: none;
        }
        #customization-canvas-wrapper img {
          -webkit-user-drag: none;
          -webkit-touch-callout: none;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ========== Canvas ========== */}
        <div className="flex-shrink-0 flex flex-col items-center w-full lg:w-auto">
          {productName && (
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{productName}</h3>
          )}

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

          <div ref={containerRef} className="w-full flex justify-center">
            <div
              ref={wrapperRef}
              id="customization-canvas-wrapper"
              style={{ width: scaledW, height: scaledH }}
            >
              <div
                id="customization-canvas"
                className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200 bg-gray-100"
                style={{ width: scaledW, height: scaledH, touchAction: 'none' }}
                onPointerDown={(e) => {
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

                {/* Layer 2: Editable elements. Positions/sizes are stored in
                    logical (340×560) space and converted to display space
                    via `scale`. */}
                {elements.map((el) => (
                  <div
                    key={el.id}
                    onPointerDown={onElementPointerDown(el)}
                    onPointerMove={onElementPointerMove(el)}
                    onPointerUp={onElementPointerUp(el)}
                    onPointerCancel={onElementPointerUp(el)}
                    className={
                      'absolute ' +
                      (selectedId === el.id ? 'ring-2 ring-orange-500 ring-offset-1' : '')
                    }
                    style={{
                      left: toDisplay(el.x, scale),
                      top: toDisplay(el.y, scale),
                      width: toDisplay(el.width, scale),
                      height: toDisplay(el.height, scale),
                      zIndex: selectedId === el.id ? 20 : 10,
                      touchAction: 'none',
                      cursor: 'move',
                    }}
                  >
                    {el.type === 'image' ? (
                      el.broken ? (
                        // The browser failed to decode/render this image —
                        // show that clearly instead of leaving blank space,
                        // and let the person remove it and try again.
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-sm p-2 pointer-events-auto">
                          <p className="text-[11px] text-red-600 text-center font-medium leading-tight">
                            Image couldn&apos;t load on this device
                          </p>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              removeElement(el.id);
                            }}
                            className="text-[10px] text-red-500 underline"
                          >
                            Remove &amp; try again
                          </button>
                        </div>
                      ) : (
                        <img
                          src={el.src}
                          alt="Custom upload"
                          className="w-full h-full object-contain pointer-events-none select-none"
                          draggable={false}
                          onError={() => updateElement(el.id, { broken: true })}
                          style={{
                            filter: `contrast(${el.contrast ?? 100}%) brightness(${el.brightness ?? 100}%) saturate(${el.saturate ?? 100}%)`,
                            transform: el.flipX ? 'scaleX(-1)' : 'scaleX(1)',
                            touchAction: 'none',
                            WebkitUserDrag: 'none',
                            WebkitTouchCallout: 'none',
                          } as React.CSSProperties}
                        />
                      )
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center select-none"
                        style={{
                          fontSize: `${toDisplay(el.fontSize, scale)}px`,
                          color: el.color,
                          fontFamily: el.fontFamily,
                          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                          wordBreak: 'break-word',
                          lineHeight: 1.2,
                          pointerEvents: 'none',
                        }}
                      >
                        {el.content}
                      </div>
                    )}

                    {/* Corner resize handles — desktop mouse or precise touch */}
                    {selectedId === el.id &&
                      handleDefs.map(({ corner, style }) => (
                        <div
                          key={corner}
                          onPointerDown={startHandleDrag(el, corner)}
                          className="case-resize-handle absolute rounded-full bg-white border-4 border-orange-500 shadow-lg"
                          style={{
                            ...style,
                            width: HANDLE_HIT_SIZE,
                            height: HANDLE_HIT_SIZE,
                            transform: 'translate(-50%, -50%)',
                            touchAction: 'none',
                            zIndex: 30,
                          }}
                        />
                      ))}
                  </div>
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
              <p className="text-[11px] text-gray-400 font-medium">
                Drag a corner to resize · pinch with two fingers on touch · drag to move
              </p>
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
                      const newH = newW / selectedElement.aspect;
                      const pos = clampPos(selectedElement.x, selectedElement.y, newW, newH);
                      updateElement(selectedElement.id, {
                        width: newW,
                        height: newH,
                        x: pos.x,
                        y: pos.y,
                      });
                    } else {
                      const pos = clampPos(selectedElement.x, selectedElement.y, newW, selectedElement.height);
                      updateElement(selectedElement.id, {
                        width: newW,
                        x: pos.x,
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

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 gap-2 border-dashed border-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? 'Processing...' : 'Upload Image'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {error && <p className="text-red-500 text-xs col-span-2 -mt-2">{error}</p>}

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