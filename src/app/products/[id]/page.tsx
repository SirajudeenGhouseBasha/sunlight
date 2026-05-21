import { createClient } from '@/src/lib/supabase/server'
import { ProductPageProps } from './ProductDetailsPage'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

export { default } from './ProductDetailsPage'

// Generate static params for popular products (optional)
export async function generateStaticParams() {
  try {
    // This would typically fetch popular product IDs
    // For now, return empty array to generate on-demand
    return []
  } catch (error) {
    console.error('Failed to generate static params:', error)
    return []
  }
}

// Metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: variant } = await supabase
      .from('variants')
      .select(`
        id,
        name,
        model:models!inner (
          name,
          brand:brands!inner (
            name
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (!variant) {
      return {
        title: 'Product Not Found | Sunlight',
        description: 'The requested product could not be found.',
      }
    }
    
    const model = Array.isArray(variant.model) ? variant.model[0] : variant.model
    const brand = model && (Array.isArray(model.brand) ? model.brand[0] : model.brand)
    const productName = brand && model ? `${brand.name} ${model.name}`.trim() : 'Phone Case'
    
    return {
      title: `${productName} | Sunlight`,
      description: `Shop ${productName} - Premium phone case with excellent protection and style.`,
      openGraph: {
        title: productName,
        description: `Shop ${productName} - Premium phone case with excellent protection and style.`,
      },
    }
  } catch {
    return {
      title: 'Product | Sunlight',
      description: 'Premium phone cases with excellent protection and style.',
    }
  }
}