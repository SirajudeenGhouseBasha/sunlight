/**
 * Custom Design Type Definitions
 *
 * Types for custom phone case design data, layers, elements, and template
 * constraints used by the design editor and production pipeline.
 *
 * Requirements: 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 8.4
 */

// =============================================
// LAYER TYPES
// =============================================

/** Discriminated union tag for design layers */
export type DesignLayerType = 'text' | 'image';

/** Allowed blend modes for layer compositing */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

// =============================================
// BASE LAYER INTERFACE
// =============================================

/**
 * Common properties shared by all design layer types.
 * Extended by TextElement and ImageElement.
 */
export interface DesignLayer {
  /** Unique identifier for the layer within the design */
  id: string;
  /** Discriminator tag identifying the concrete layer type */
  type: DesignLayerType;
  /** Horizontal position from the canvas left edge, in pixels */
  x: number;
  /** Vertical position from the canvas top edge, in pixels */
  y: number;
  /** Layer width in pixels */
  width: number;
  /** Layer height in pixels */
  height: number;
  /** Rotation angle in degrees (0–360) */
  rotation: number;
  /** Opacity from 0 (fully transparent) to 1 (fully opaque) */
  opacity: number;
  /** Whether this layer is currently visible */
  visible: boolean;
  /** Whether this layer is locked from editing */
  locked: boolean;
  /** Render order; higher z-index appears above lower values */
  z_index: number;
  /** Optional blend mode for compositing with layers below */
  blend_mode?: BlendMode;
}

// =============================================
// TEXT ELEMENT
// =============================================

/** Horizontal text alignment options */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/** Font weight options */
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

/** Font style options */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * A text layer within a custom design.
 * Extends DesignLayer with typography-specific properties.
 *
 * Requirements: 3.3, 8.3
 */
export interface TextElement extends DesignLayer {
  type: 'text';
  /** The text string to render */
  content: string;
  /** Font family name; must be in TemplateConstraints.allowed_fonts */
  font_family: string;
  /** Font size in points; must be within min/max_font_size constraints */
  font_size: number;
  /** Font weight */
  font_weight: FontWeight;
  /** Font style */
  font_style: FontStyle;
  /** CSS color string (hex, rgba, etc.) */
  color: string;
  /** Horizontal alignment of text within the layer bounds */
  text_align: TextAlign;
  /** Letter spacing in pixels */
  letter_spacing?: number;
  /** Line height multiplier */
  line_height?: number;
  /** Optional text shadow definition */
  text_shadow?: {
    offset_x: number;
    offset_y: number;
    blur_radius: number;
    color: string;
  };
  /** Optional text stroke (outline) definition */
  stroke?: {
    width: number;
    color: string;
  };
}

// =============================================
// IMAGE ELEMENT
// =============================================

/** How an image is scaled within its bounding box */
export type ObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

/**
 * An image layer within a custom design.
 * Extends DesignLayer with image-specific properties.
 *
 * Requirements: 3.2, 3.4, 8.2, 8.4
 */
export interface ImageElement extends DesignLayer {
  type: 'image';
  /** URL of the image asset (must be uploaded and validated) */
  src: string;
  /** Alt text for accessibility */
  alt_text?: string;
  /** MIME type of the image; must be in TemplateConstraints.allowed_image_formats */
  mime_type: string;
  /** Original file size in bytes */
  file_size_bytes: number;
  /** Natural (original) width of the image in pixels */
  natural_width: number;
  /** Natural (original) height of the image in pixels */
  natural_height: number;
  /** How the image is scaled within the layer bounds */
  object_fit?: ObjectFit;
  /**
   * Optional clip mask applied to the image layer.
   * Expressed as a CSS clip-path value or SVG path string.
   */
  clip_path?: string;
  /** Optional color overlay tint applied on top of the image */
  tint?: {
    color: string;
    opacity: number;
  };
}

// =============================================
// TEMPLATE CONSTRAINTS
// =============================================

/**
 * Design constraints that govern what is allowed within a template.
 * Stored in models.mockup_constraints.constraints.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export interface TemplateConstraints {
  /** Maximum total number of layers allowed in the design */
  max_layers: number;
  /** Maximum number of text layers */
  max_text_elements: number;
  /** Maximum number of image layers */
  max_image_elements: number;
  /** Allowed font family names for text layers */
  allowed_fonts: string[];
  /** Minimum allowed font size in points */
  min_font_size: number;
  /** Maximum allowed font size in points */
  max_font_size: number;
  /** Maximum size in megabytes for individual image uploads */
  max_image_size_mb: number;
  /** Allowed MIME types for image uploads */
  allowed_image_formats: string[];
}

// =============================================
// TEMPLATE DATA
// =============================================

/**
 * 2D bounding rectangle, used for canvas dimensions, print area, and safe area.
 * For canvas_dimensions only x and y are omitted (origin is always 0,0).
 */
export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Canvas dimensions (width × height only; no x/y offset).
 */
export interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Full template metadata stored in models.mockup_constraints.
 * Defines the canvas, printable area, safe area, and design constraints
 * for a phone model's custom design template.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export interface TemplateData {
  /** Total canvas size in pixels */
  canvas_dimensions: CanvasDimensions;
  /**
   * Area of the canvas that will actually be printed.
   * Design elements outside this region will be clipped.
   */
  print_area: BoundingRect;
  /**
   * Recommended inner region where important design elements should reside
   * to avoid being cut off during manufacturing tolerances.
   */
  safe_area: BoundingRect;
  /** Rules governing what can be placed in the design */
  constraints: TemplateConstraints;
}

// =============================================
// CUSTOMIZATION DATA
// =============================================

/**
 * The complete custom design payload stored in
 * cart_items.custom_design_data and order_items.custom_design_data.
 *
 * Requirements: 3.2, 3.3, 3.4
 */
export interface CustomizationData {
  /** ID of the phone model this design was created for */
  model_id: string;
  /** Template metadata snapshot at the time of design creation */
  template: TemplateData;
  /**
   * Ordered list of design layers (text and image elements).
   * Rendered from lowest to highest z_index.
   */
  layers: Array<TextElement | ImageElement>;
  /** Optional background color for the design canvas (CSS color string) */
  background_color?: string;
  /** ISO 8601 timestamp when this customization was last modified */
  last_modified_at: string;
  /** Version identifier for the customization data schema */
  schema_version: string;
}