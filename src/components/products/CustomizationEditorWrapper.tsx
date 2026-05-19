/**
 * Client-side wrapper for CustomizationEditor.
 *
 * Server components cannot render react-rnd directly, so this thin
 * 'use client' wrapper is imported by the product details page.
 */

'use client';

import { CustomizationEditor } from './CustomizationEditor';

interface Props {
  variantId: string;
  caseImageUrl?: string;
  maskImageUrl?: string;
  productName?: string;
}

export function CustomizationEditorWrapper({ variantId, caseImageUrl, maskImageUrl, productName }: Props) {
  return (
    <CustomizationEditor 
      variantId={variantId} 
      caseImageUrl={caseImageUrl} 
      maskImageUrl={maskImageUrl}
      productName={productName} 
    />
  );
}
