import type { GetViewApiResponse } from '@shared/api'
import type { AccessLevel } from '@shared/components/AccessUser/AccessUser'

export type ViewFormData = Required<
  Pick<GetViewApiResponse, 'label' | 'scope' | 'visibility' | 'owner' | 'accessLevel'> & {
    access: Record<string, AccessLevel>
  }
>

export const viewTypes = [
  'overview',
  'taskProgress',
  'versions',
  'lists',
  'reviews',
  'reports',
  'events',
] as const
export type ViewType = (typeof viewTypes)[number] | string

/**
 * A ready-made view a page ships with. It is not a saved view: picking it in the views menu loads
 * its settings into the user's working view, where they can be changed and saved as a view.
 */
export type ViewPreset = {
  id: string
  label: string
  icon?: string
  // worked out when picked, where they depend on the project's data
  settings: Record<string, unknown> | (() => Promise<Record<string, unknown>>)
}

// View ID constants
export const WORKING_VIEW_ID = '_working_' as const
export const NEW_VIEW_ID = '_new_view_' as const
export const BASE_VIEW_ID = '__base__' as const
