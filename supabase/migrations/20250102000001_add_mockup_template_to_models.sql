-- Migration: Add mockup template support to models table
-- Task: 1.2 Add mockup_template_url to models table
-- Requirements: 11.1, 11.2, 8.1, 8.2, 8.3
-- 
-- This migration adds mockup template support for custom phone case designs.
-- Each model will have one mockup template URL used for all custom designs,
-- regardless of material type (material only affects pricing).

-- Add mockup_template_url column to models table
-- This stores the URL to the mockup template image used for custom design creation
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS mockup_template_url TEXT;

-- Add mockup_constraints column to models table
-- This stores template metadata including canvas dimensions, print area, safe area, and constraints
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS mockup_constraints JSONB;

-- Add comment for documentation
COMMENT ON COLUMN models.mockup_template_url IS 'URL to the mockup template image for custom design creation. One template per model, used regardless of material type.';
COMMENT ON COLUMN models.mockup_constraints IS 'Template metadata: canvas_dimensions, print_area, safe_area, and design constraints (max_layers, allowed_fonts, etc.)';

-- Create index for models with mockup templates (for filtering models that support custom designs)
CREATE INDEX IF NOT EXISTS idx_models_has_mockup ON models(mockup_template_url) WHERE mockup_template_url IS NOT NULL;

-- Update existing models with placeholder mockup URLs for development
-- These are placeholder values that should be replaced with actual mockup template URLs in production
UPDATE models 
SET 
    mockup_template_url = 'https://placeholder.com/mockups/' || slug || '.png',
    mockup_constraints = jsonb_build_object(
        'canvas_dimensions', jsonb_build_object(
            'width', 1000,
            'height', 2000
        ),
        'print_area', jsonb_build_object(
            'x', 100,
            'y', 200,
            'width', 800,
            'height', 1600
        ),
        'safe_area', jsonb_build_object(
            'x', 150,
            'y', 250,
            'width', 700,
            'height', 1500
        ),
        'constraints', jsonb_build_object(
            'max_layers', 10,
            'max_text_elements', 5,
            'max_image_elements', 5,
            'allowed_fonts', jsonb_build_array(
                'Arial',
                'Helvetica',
                'Times New Roman',
                'Georgia',
                'Courier New',
                'Verdana',
                'Impact',
                'Comic Sans MS'
            ),
            'min_font_size', 12,
            'max_font_size', 144,
            'max_image_size_mb', 10,
            'allowed_image_formats', jsonb_build_array(
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/svg+xml'
            )
        )
    )
WHERE is_active = true;

-- Validation: Ensure mockup_constraints has required structure when mockup_template_url is set
-- This constraint ensures data integrity for models with mockup templates
ALTER TABLE models DROP CONSTRAINT IF EXISTS check_mockup_constraints_structure;
ALTER TABLE models 
ADD CONSTRAINT check_mockup_constraints_structure 
CHECK (
    mockup_template_url IS NULL 
    OR (
        mockup_constraints IS NOT NULL 
        AND mockup_constraints ? 'canvas_dimensions'
        AND mockup_constraints ? 'print_area'
        AND mockup_constraints ? 'safe_area'
        AND mockup_constraints ? 'constraints'
    )
);
