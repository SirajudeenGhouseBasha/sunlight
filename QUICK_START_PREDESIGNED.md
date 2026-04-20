# 🚀 Quick Start: Create Your First Predesigned Case

## ⚡ 5-Minute Setup

### Step 1: Apply Database Migration (2 min)

1. Open: https://supabase.com/dashboard/project/bimolyuiboouvqgviztb/editor
2. Click "New Query"
3. Copy this SQL:

```sql
CREATE TABLE predesigned_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_override DECIMAL(10,2),
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
CREATE INDEX idx_predesigned_display_order ON predesigned_products(display_order);
```

4. Click "Run"
5. ✅ Done!

---

### Step 2: Upload a Design (1 min)

1. Go to: http://localhost:3000/designs/create
2. Upload an image (e.g., sunset gradient, abstract pattern)
3. Name: "Sunset Gradient"
4. Click "Upload"
5. Copy the design ID from the success message

---

### Step 3: Mark Design as Template (1 min)

In Supabase SQL Editor:

```sql
UPDATE designs 
SET is_template = true,
    category = 'abstract',
    is_public = true,
    tags = ARRAY['sunset', 'gradient', 'warm']
WHERE name = 'Sunset Gradient';
```

---

### Step 4: Create Predesigned Product (1 min)

1. Go to: http://localhost:3000/admin/predesigned/create
2. Select:
   - Brand: Apple
   - Model: iPhone 15 Pro
   - Case Type: Silicone Case
   - Color: White
3. Click the design you uploaded
4. Name: "Sunset Gradient iPhone 15 Pro Case"
5. Check "Featured" and "Active"
6. Click "Create"

---

## ✅ Done!

Your first predesigned case is ready!

**View it at:**
- Admin: http://localhost:3000/admin/predesigned
- Products: http://localhost:3000/products (after frontend update)

---

## 🎯 What You Just Created

- ✅ Database table for predesigned products
- ✅ Design template in the system
- ✅ Predesigned case ready to sell
- ✅ Featured product for homepage

---

## 📱 Admin URLs

- **Manage Predesigned:** `/admin/predesigned`
- **Create New:** `/admin/predesigned/create`
- **Upload Designs:** `/designs/create`
- **Admin Dashboard:** `/admin`

---

## 💡 Tips

1. **Create 5-10 designs** for variety
2. **Use different categories** (abstract, nature, minimal)
3. **Mark popular ones as featured**
4. **Set custom prices** for premium designs
5. **Test the workflow** before going live

---

## 🐛 Issues?

### Can't see designs in create form?
```sql
-- Check if designs are marked as templates
SELECT id, name, is_template FROM designs;

-- Mark as template
UPDATE designs SET is_template = true WHERE id = 'your-id';
```

### Can't find variants?
- Create variants first at `/admin/variants`
- Make sure brand, model, and product type exist

### Migration error?
- Copy the full SQL from `supabase/migrations/20241220000001_create_predesigned_products.sql`
- Run it in Supabase SQL Editor

---

## 🎉 Next Steps

1. Create more design templates
2. Create predesigned products for different models
3. Update products page to show predesigned cases
4. Add featured section to homepage
5. Test the complete purchase flow

**You're all set! Start creating beautiful predesigned cases! 🚀**
