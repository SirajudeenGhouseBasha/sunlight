# Product Creation Guide

## Overview
This guide explains how to create products (phone cases) in the system.

## Product Hierarchy

```
Brand (e.g., Apple)
  └── Model (e.g., iPhone 15 Pro)
      └── Product Type (e.g., Silicone Case - $19.99 base price)
          └── Variant (e.g., Black Silicone Case for iPhone 15 Pro - $19.99)
```

## Step-by-Step Process

### 1. Create Brand
**URL:** http://localhost:3000/admin

**Fields:**
- Brand Name (e.g., "Apple", "Samsung")
- Slug (auto-generated, e.g., "apple")
- Logo URL (optional)
- Description (optional)

**Example:**
```
Name: Apple
Slug: apple
Description: Premium smartphones and devices
```

---

### 2. Create Phone Model
**URL:** http://localhost:3000/admin

**Fields:**
- Brand (select from dropdown)
- Model Name (e.g., "iPhone 15 Pro")
- Model Number (e.g., "A2848")
- Screen Size (e.g., "6.1")
- Release Year (e.g., "2023")

**Example:**
```
Brand: Apple
Model Name: iPhone 15 Pro
Model Number: A2848
Screen Size: 6.1
Release Year: 2023
```

---

### 3. Create Product Type (Case Type)
**URL:** http://localhost:3000/admin/product-types

**Fields:**
- Type Name (e.g., "Silicone Case")
- Base Price (e.g., "19.99")
- Description
- Material Properties:
  - Material (e.g., "Silicone")
  - Finish (e.g., "Matte")
  - Thickness (e.g., "1.5mm")
  - Weight (e.g., "30g")
  - Features (e.g., "Shock-absorbing, Wireless charging compatible")

**Example:**
```
Name: Silicone Case
Base Price: $19.99
Description: Soft-touch silicone case with microfiber lining
Material: Premium Silicone
Finish: Matte
Thickness: 1.5mm
Weight: 30g
Features: Shock-absorbing, Wireless charging compatible, Raised edges
```

---

### 4. Create Variant (Actual Product)
**URL:** http://localhost:3000/admin/variants

**Fields:**
- Brand (select)
- Model (select - filtered by brand)
- Product Type (select)
- Color Name (e.g., "Midnight Black")
- Color Hex (e.g., "#000000")
- Price Modifier (e.g., "0.00" or "5.00" for premium colors)
- Stock Quantity (e.g., "100")
- SKU (auto-generated or custom)
- Product Image (upload to S3)

**Example:**
```
Brand: Apple
Model: iPhone 15 Pro
Product Type: Silicone Case
Color Name: Midnight Black
Color Hex: #000000
Price Modifier: $0.00
Stock Quantity: 100
SKU: APPL-IP15P-SIL-BLK
```

**Final Price = Base Price + Price Modifier**
- Base Price: $19.99
- Price Modifier: $0.00
- **Final Price: $19.99**

---

## Quick Start Example

### Create Your First Product (iPhone 15 Pro Black Silicone Case)

1. **Create Brand:**
   - Go to: http://localhost:3000/admin
   - Click "Add Brand"
   - Name: "Apple"
   - Save

2. **Create Model:**
   - Click "Add Model"
   - Brand: Apple
   - Name: "iPhone 15 Pro"
   - Screen Size: 6.1
   - Save

3. **Create Product Type:**
   - Go to: http://localhost:3000/admin/product-types
   - Click "Create Product Type"
   - Name: "Silicone Case"
   - Base Price: 19.99
   - Description: "Premium silicone case"
   - Material: Silicone
   - Save

4. **Create Variant:**
   - Go to: http://localhost:3000/admin/variants
   - Click "Create Variant"
   - Select: Apple → iPhone 15 Pro → Silicone Case
   - Color: "Black" (#000000)
   - Price Modifier: 0
   - Stock: 100
   - Upload product image
   - Save

5. **View Product:**
   - Go to: http://localhost:3000/products
   - Your product should appear!

---

## Bulk Creation

For creating multiple variants at once:
- Go to: http://localhost:3000/admin/variants
- Use "Bulk Variant Creator"
- Select brand, model, product type
- Choose multiple colors
- Set stock quantity
- Creates all variants at once!

---

## Product Images

### Where to Upload:
- **Product Images:** Upload via variant creation form
- **Stored in:** AWS S3 (`products/` folder)
- **Format:** JPG, PNG, WebP
- **Max Size:** 5MB
- **Recommended:** 1000x1000px or higher

### Image Guidelines:
- Use high-quality product photos
- White or transparent background
- Show the case clearly
- Multiple angles (optional)

---

## Design Integration

### User Designs:
- Users upload designs at: http://localhost:3000/designs/create
- Designs stored in: AWS S3 (`designs/{userId}/` folder)
- Designs can be applied to any variant during checkout

### Admin Templates:
- Create template designs for users to choose from
- Mark designs as `is_template = true`
- Set category (e.g., "abstract", "nature", "geometric")

---

## Pricing Strategy

### Base Price (Product Type):
- Set the standard price for the case type
- Example: All silicone cases = $19.99

### Price Modifier (Variant):
- Add extra cost for premium colors/materials
- Example: Rose Gold = +$5.00
- Final Price = $19.99 + $5.00 = $24.99

### Custom Design Fee:
- Can be added during checkout
- Configured in product type settings

---

## Inventory Management

### Stock Tracking:
- Set initial stock when creating variant
- Stock decreases automatically on order
- Low stock alerts (coming soon)

### Out of Stock:
- Products with 0 stock show "Out of Stock"
- Users cannot add to cart
- Restock by editing variant

---

## Admin URLs Quick Reference

- **Main Admin:** http://localhost:3000/admin
- **Product Types:** http://localhost:3000/admin/product-types
- **Variants:** http://localhost:3000/admin/variants
- **Browse Products:** http://localhost:3000/products

---

## Tips

1. **Create brands and models first** - You'll need them for variants
2. **Use descriptive names** - Helps with search and filtering
3. **Set realistic stock** - Start with 50-100 units per variant
4. **Use hex colors** - Ensures consistent color display
5. **Upload quality images** - First impression matters!
6. **Test the flow** - Create a test product and try buying it

---

## Troubleshooting

### "Brand not found"
- Make sure you created the brand first

### "Model not found"
- Create the phone model before creating variants

### "Upload failed"
- Check AWS S3 credentials in `.env.local`
- Ensure bucket policy allows uploads

### "Price not showing"
- Check base price in product type
- Verify price modifier in variant

---

## Next Steps

After creating products:
1. Test the shopping flow
2. Add more variants (colors)
3. Create product types for different materials
4. Upload design templates
5. Set up inventory alerts
