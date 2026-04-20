# Predesigned Case Creation Guide

## 🎨 What is a Predesigned Case?

A predesigned case is a phone case with a **ready-made design** that customers can buy directly without uploading their own design. Think of it like a catalog of beautiful cases ready to purchase.

---

## 📋 Complete Workflow

### Step 1: Create the Base Product Structure

First, you need the foundation (if not already created):

1. **Create Brand** (e.g., Apple)
   - Go to `/admin`
   - Add brand details

2. **Create Model** (e.g., iPhone 15 Pro)
   - Select the brand
   - Add model details

3. **Create Product Type** (e.g., Silicone Case)
   - Go to `/admin/product-types`
   - Set base price (e.g., $19.99)
   - Add material details

4. **Create Variant** (e.g., White Silicone Case)
   - Go to `/admin/variants`
   - Select: Brand → Model → Product Type
   - Choose color (e.g., White)
   - Upload product image (blank case)
   - Set stock quantity

---

### Step 2: Create the Design Template

Now create the actual design that will be printed on the case:

**URL:** `/designs/create` (or admin design manager)

**Fields:**
- **Name:** "Sunset Gradient" (descriptive name)
- **Description:** "Beautiful orange and pink sunset gradient"
- **Image:** Upload the design artwork (PNG/JPG)
- **Is Template:** `true` (marks it as admin-managed)
- **Category:** "abstract", "nature", "geometric", etc.
- **Tags:** ["sunset", "gradient", "warm", "orange"]
- **Is Public:** `true` (visible to all users)

**Design Image Requirements:**
- Format: PNG (with transparency) or JPG
- Size: 1000x1000px minimum
- Resolution: 300 DPI for print quality
- File size: Under 5MB
- Stored in: S3 `designs/templates/`

---

### Step 3: Link Design to Variant (Database)

Currently, you need to manually link the design to the variant in the database:

```sql
-- Option 1: Update the variant to include the design
UPDATE variants 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{predesigned_template_id}',
  '"<design-uuid>"'::jsonb
)
WHERE id = '<variant-uuid>';

-- Option 2: Create a dedicated predesigned_products table (recommended)
-- This allows one design to be used on multiple variants
```

---

## 🎯 Recommended Approach: Predesigned Products Table

For better management, create a dedicated table:

```sql
CREATE TABLE predesigned_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "Sunset iPhone 15 Pro Case"
    description TEXT,
    price_override DECIMAL(10,2), -- Optional: override variant price
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, design_id)
);

CREATE INDEX idx_predesigned_variant ON predesigned_products(variant_id);
CREATE INDEX idx_predesigned_design ON predesigned_products(design_id);
CREATE INDEX idx_predesigned_featured ON predesigned_products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_predesigned_active ON predesigned_products(is_active) WHERE is_active = true;
```

---

## 🛠️ Admin Interface Needed

### Create Predesigned Product Form

**URL:** `/admin/predesigned` (to be created)

**Form Fields:**
1. **Select Variant:**
   - Brand dropdown → Model dropdown → Product Type dropdown → Variant dropdown
   - Shows: "Apple iPhone 15 Pro - White Silicone Case"

2. **Select Design:**
   - Browse template designs
   - Preview thumbnail
   - Search by name/category/tags

3. **Product Details:**
   - Name: "Sunset iPhone 15 Pro Silicone Case"
   - Description: "Beautiful sunset gradient on premium silicone"
   - Price Override: (optional) $24.99 instead of base $19.99
   - Is Featured: ✓ (show on homepage)
   - Is Active: ✓ (available for purchase)

4. **Preview:**
   - Show design mockup on the case
   - Display final price
   - Show stock availability

5. **Save:**
   - Creates predesigned_products record
   - Links variant + design
   - Makes it available on products page

---

## 📱 Customer Experience

### How Customers See Predesigned Cases:

1. **Products Page** (`/products`)
   - Shows all variants (blank cases)
   - Shows predesigned cases (with design preview)
   - Filter by: Brand, Model, Type, Design Category

2. **Product Detail Page** (`/products/[id]`)
   - Shows design preview on case
   - Displays price
   - "Add to Cart" button
   - Related designs for same model

3. **Cart & Checkout**
   - Shows case with design
   - No design upload needed
   - Direct purchase flow

---

## 🎨 Design Categories

Organize templates by category:

- **Abstract:** Geometric patterns, gradients, minimalist
- **Nature:** Flowers, landscapes, animals
- **Artistic:** Paintings, illustrations, watercolor
- **Minimal:** Simple lines, solid colors, typography
- **Trendy:** Current design trends, seasonal
- **Custom:** Brand collaborations, limited editions

---

## 💰 Pricing Strategy

### Option 1: Base Price + Design Fee
- Variant base price: $19.99
- Design fee: +$5.00
- **Total: $24.99**

### Option 2: Price Override
- Set custom price per predesigned product
- Example: Premium designs = $29.99
- Featured designs = $34.99

### Option 3: Dynamic Pricing
- Popular designs (high usage_count) = higher price
- New designs = promotional price
- Seasonal designs = variable pricing

---

## 📊 Example: Complete Predesigned Case

### Product: "Sunset Gradient iPhone 15 Pro Case"

**Base Structure:**
- Brand: Apple
- Model: iPhone 15 Pro
- Product Type: Silicone Case ($19.99)
- Variant: White Silicone Case (stock: 100)

**Design Template:**
- Name: "Sunset Gradient"
- Category: Abstract
- Tags: ["sunset", "gradient", "warm"]
- Image: `s3://sunlight-s3-demo/designs/templates/sunset-gradient.png`
- Is Template: true
- Is Public: true

**Predesigned Product:**
- Name: "Sunset Gradient iPhone 15 Pro Case"
- Description: "Beautiful orange and pink sunset gradient on premium white silicone"
- Price: $24.99 (base $19.99 + design $5.00)
- Is Featured: true
- Is Active: true

**Customer Sees:**
- Product image: White case with sunset gradient design
- Price: $24.99
- "Add to Cart" → Direct purchase
- No design upload needed

---

## 🚀 Quick Start (Current System)

### Without Admin Interface (Manual Process):

1. **Create the variant** (blank case)
   ```
   Go to /admin/variants
   Create: Apple iPhone 15 Pro White Silicone Case
   ```

2. **Upload design as template**
   ```
   Go to /designs/create
   Upload design image
   Name: "Sunset Gradient"
   ```

3. **Get design ID from database**
   ```sql
   SELECT id, name FROM designs WHERE is_template = true;
   ```

4. **Link design to variant**
   ```sql
   UPDATE variants 
   SET metadata = jsonb_build_object('predesigned_template_id', '<design-id>')
   WHERE id = '<variant-id>';
   ```

5. **Update products API** to show predesigned cases
   - Fetch variant with design
   - Display design preview
   - Show combined price

---

## 🔧 What Needs to Be Built

To make this fully functional, you need:

### 1. Database Migration
- [ ] Create `predesigned_products` table
- [ ] Add indexes for performance
- [ ] Add foreign key constraints

### 2. Admin Interface
- [ ] `/admin/predesigned` - List all predesigned products
- [ ] `/admin/predesigned/create` - Create new predesigned product
- [ ] `/admin/predesigned/[id]/edit` - Edit existing
- [ ] Design template browser/selector
- [ ] Preview mockup generator

### 3. API Endpoints
- [ ] `GET /api/predesigned` - List predesigned products
- [ ] `POST /api/predesigned` - Create predesigned product
- [ ] `PATCH /api/predesigned/[id]` - Update
- [ ] `DELETE /api/predesigned/[id]` - Delete
- [ ] `GET /api/designs/templates` - List template designs

### 4. Frontend Updates
- [ ] Update products page to show predesigned cases
- [ ] Add design preview to product cards
- [ ] Filter by design category
- [ ] Featured predesigned section on homepage

### 5. Design Upload Improvements
- [ ] Admin-only design upload with template flag
- [ ] Category selector
- [ ] Tag input
- [ ] Preview generator

---

## 📝 Summary

**Current State:**
- ✅ Variants (blank cases) can be created
- ✅ Designs can be uploaded
- ✅ Database supports templates (`is_template` flag)
- ❌ No linking between variants and designs
- ❌ No admin interface for predesigned products
- ❌ Products page doesn't show predesigned cases

**To Create a Predesigned Case Now:**
1. Create variant (blank case)
2. Upload design with `is_template = true`
3. Manually link in database
4. Update frontend to display

**Recommended Next Steps:**
1. Create `predesigned_products` table
2. Build admin interface for managing predesigned products
3. Update products API to include predesigned cases
4. Add design preview to product cards
5. Create featured predesigned section

---

## 🎯 Want Me to Build This?

I can create:
1. Database migration for `predesigned_products` table
2. Admin page for creating/managing predesigned products
3. API endpoints for predesigned products
4. Updated products page to show predesigned cases
5. Design template browser

Just let me know and I'll build the complete system! 🚀
