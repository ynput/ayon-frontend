import type { TraitDefinitionListItem } from '@shared/api/generated/traits'

// Subset of JSON Schema used by trait definitions (see the trait manifest exporter in ayon-core)
export type TraitJsonSchema = {
  type?: string | string[]
  format?: string
  title?: string
  description?: string
  enum?: unknown[]
  default?: unknown
  properties?: Record<string, TraitJsonSchema>
  required?: string[]
  items?: TraitJsonSchema
  prefixItems?: TraitJsonSchema[]
  additionalProperties?: TraitJsonSchema | boolean
  anyOf?: TraitJsonSchema[]
  $ref?: string
  $defs?: Record<string, TraitJsonSchema>
}

// Optional rendering hints of a trait (`ui_hints` on the trait class)
export type TraitUiHints = {
  group?: string
  widget?: string
  [key: string]: unknown
}

export type TraitDefinition = Omit<TraitDefinitionListItem, 'schema' | 'ui'> & {
  schema?: TraitJsonSchema
  ui?: TraitUiHints | null
}

// versioned trait id -> definition
export type TraitDefinitions = Record<string, TraitDefinition>
