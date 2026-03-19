import { EntityLinkQuery } from '../getEntityLinks'

// Helper function to format entity label based on type
export const formatEntityLabel = (node: any): string | undefined => {
  if (!node) return undefined
  // Use label if available, otherwise fallback to name
  return node.label
}
