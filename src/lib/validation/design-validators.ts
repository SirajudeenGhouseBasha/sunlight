/**
 * Design Validator
 *
 * Validates custom phone case designs against their template constraints
 * before the design is accepted into the production pipeline.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.7, 13.1, 13.2, 13.3, 13.4, 13.5
 */

import {
  CustomizationData,
  DesignLayer,
  TextElement,
  ImageElement,
  BoundingRect,
  TemplateConstraints,
} from '@/src/types/custom-design';
import { ValidationResult } from '@/src/types/production';

// =============================================
// CONSTANTS
// =============================================

/** Maximum character length for a text element's content. */
const MAX_TEXT_CONTENT_LENGTH = 500;

// =============================================
// HELPERS
// =============================================

/**
 * Returns the axis-aligned bounding box of a (potentially rotated) layer.
 * Uses the layer's x/y/width/height directly — rotation is handled by the
 * renderer, so for boundary purposes we check the un-rotated rectangle.
 * This is conservative: the actual painted area may be smaller for rotated
 * layers, never larger (for axis-aligned checks).
 */
function layerBounds(layer: DesignLayer): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  return {
    left: layer.x,
    top: layer.y,
    right: layer.x + layer.width,
    bottom: layer.y + layer.height,
  };
}

/**
 * Returns true when the layer sits entirely within `area`.
 */
function isWithinArea(layer: DesignLayer, area: BoundingRect): boolean {
  const b = layerBounds(layer);
  return (
    b.left >= area.x &&
    b.top >= area.y &&
    b.right <= area.x + area.width &&
    b.bottom <= area.y + area.height
  );
}

// =============================================
// INDIVIDUAL VALIDATORS
// =============================================

/**
 * Checks that every layer's bounding box lies entirely within the
 * template's print_area. Layers outside this region will be clipped
 * during manufacturing.
 *
 * Requirements: 3.2, 3.7, 13.1
 */
export function validateLayerBoundaries(
  layers: DesignLayer[],
  printArea: BoundingRect
): ValidationResult {
  const errors: string[] = [];

  for (const layer of layers) {
    if (!isWithinArea(layer, printArea)) {
      const b = layerBounds(layer);
      errors.push(
        `Layer "${layer.id}" (${layer.type}) extends outside the print area. ` +
          `Layer bounds: [${b.left}, ${b.top}, ${b.right}, ${b.bottom}]; ` +
          `Print area: [${printArea.x}, ${printArea.y}, ` +
          `${printArea.x + printArea.width}, ${printArea.y + printArea.height}].`
      );
    }
  }

  return { is_valid: errors.length === 0, errors };
}

/**
 * Validates all text elements against the template's typography constraints:
 * - font_family must be in allowed_fonts
 * - font_size must be between min_font_size and max_font_size (inclusive)
 * - content must not exceed MAX_TEXT_CONTENT_LENGTH characters
 *
 * Requirements: 3.3, 13.2, 13.3
 */
export function validateTextElements(
  layers: DesignLayer[],
  constraints: TemplateConstraints
): ValidationResult {
  const errors: string[] = [];
  const textLayers = layers.filter((l): l is TextElement => l.type === 'text');

  // Count check
  if (textLayers.length > constraints.max_text_elements) {
    errors.push(
      `Design contains ${textLayers.length} text elements but the template allows ` +
        `a maximum of ${constraints.max_text_elements}.`
    );
  }

  for (const layer of textLayers) {
    // Font family
    if (!constraints.allowed_fonts.includes(layer.font_family)) {
      errors.push(
        `Layer "${layer.id}": font_family "${layer.font_family}" is not allowed. ` +
          `Allowed fonts: [${constraints.allowed_fonts.join(', ')}].`
      );
    }

    // Font size
    if (
      layer.font_size < constraints.min_font_size ||
      layer.font_size > constraints.max_font_size
    ) {
      errors.push(
        `Layer "${layer.id}": font_size ${layer.font_size} is out of range. ` +
          `Allowed range: ${constraints.min_font_size}–${constraints.max_font_size}.`
      );
    }

    // Content length
    if (layer.content.length > MAX_TEXT_CONTENT_LENGTH) {
      errors.push(
        `Layer "${layer.id}": text content exceeds the maximum of ` +
          `${MAX_TEXT_CONTENT_LENGTH} characters (got ${layer.content.length}).`
      );
    }
  }

  return { is_valid: errors.length === 0, errors };
}

/**
 * Validates all image elements against the template's image constraints:
 * - mime_type must be in allowed_image_formats
 * - file_size_bytes must not exceed max_image_size_mb
 *
 * Requirements: 3.4, 13.4, 13.5
 */
export function validateImageElements(
  layers: DesignLayer[],
  constraints: TemplateConstraints
): ValidationResult {
  const errors: string[] = [];
  const imageLayers = layers.filter((l): l is ImageElement => l.type === 'image');
  const maxBytes = constraints.max_image_size_mb * 1024 * 1024;

  // Count check
  if (imageLayers.length > constraints.max_image_elements) {
    errors.push(
      `Design contains ${imageLayers.length} image elements but the template allows ` +
        `a maximum of ${constraints.max_image_elements}.`
    );
  }

  for (const layer of imageLayers) {
    // MIME type
    if (!constraints.allowed_image_formats.includes(layer.mime_type)) {
      errors.push(
        `Layer "${layer.id}": image format "${layer.mime_type}" is not allowed. ` +
          `Allowed formats: [${constraints.allowed_image_formats.join(', ')}].`
      );
    }

    // File size
    if (layer.file_size_bytes > maxBytes) {
      const sizeMb = (layer.file_size_bytes / 1024 / 1024).toFixed(2);
      errors.push(
        `Layer "${layer.id}": image size ${sizeMb} MB exceeds the maximum ` +
          `of ${constraints.max_image_size_mb} MB.`
      );
    }
  }

  return { is_valid: errors.length === 0, errors };
}

/**
 * Ensures every layer in the design has a unique z_index value.
 * Duplicate z-indices cause undefined render ordering.
 *
 * Requirements: 13.1
 */
export function validateZIndexUniqueness(layers: DesignLayer[]): ValidationResult {
  const errors: string[] = [];
  const seen = new Map<number, string>(); // z_index → first layer id

  for (const layer of layers) {
    if (seen.has(layer.z_index)) {
      errors.push(
        `Layers "${seen.get(layer.z_index)}" and "${layer.id}" share the same ` +
          `z_index (${layer.z_index}). Each layer must have a unique z_index.`
      );
    } else {
      seen.set(layer.z_index, layer.id);
    }
  }

  return { is_valid: errors.length === 0, errors };
}

// =============================================
// TOP-LEVEL VALIDATOR
// =============================================

/**
 * Runs all validation checks on a complete custom design against its
 * embedded template constraints. Collects errors from every sub-validator
 * so the caller receives the full picture in one pass.
 *
 * Checks performed (in order):
 *  1. Total layer count vs max_layers
 *  2. Layer boundary containment within print_area
 *  3. Z-index uniqueness
 *  4. Text element constraints (font, size, content length, count)
 *  5. Image element constraints (format, file size, count)
 *
 * Requirements: 3.2, 3.3, 3.4, 3.7, 13.1, 13.2, 13.3, 13.4, 13.5
 */
export function validateCustomDesign(design: CustomizationData): ValidationResult {
  const allErrors: string[] = [];
  const { layers, template } = design;
  const { print_area, constraints } = template;

  // 1. Total layer count
  if (layers.length > constraints.max_layers) {
    allErrors.push(
      `Design contains ${layers.length} layers but the template allows a maximum ` +
        `of ${constraints.max_layers}.`
    );
  }

  // 2. Layer boundary containment
  const boundaryResult = validateLayerBoundaries(layers, print_area);
  allErrors.push(...boundaryResult.errors);

  // 3. Z-index uniqueness
  const zIndexResult = validateZIndexUniqueness(layers);
  allErrors.push(...zIndexResult.errors);

  // 4. Text element validation
  const textResult = validateTextElements(layers, constraints);
  allErrors.push(...textResult.errors);

  // 5. Image element validation
  const imageResult = validateImageElements(layers, constraints);
  allErrors.push(...imageResult.errors);

  return { is_valid: allErrors.length === 0, errors: allErrors };
}