import type { ComponentType } from 'react'
import type { TraitDefinition } from '@shared/api'
import type { TraitWidgetRegistry } from './utils/traitModel'

export type TraitWidgetProps = {
  traitId: string
  data: unknown
  definition?: TraitDefinition
}

// Dedicated widgets for traits, keyed by versionless trait id (or by a `ui.widget` name).
// Traits without a widget use the schema-driven view, or the raw table without a definition.
export const traitWidgets: TraitWidgetRegistry<ComponentType<TraitWidgetProps>> = {}
