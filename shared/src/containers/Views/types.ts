import type { GetViewApiResponse } from '@shared/api'
import type { AccessLevel } from '@shared/components'

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
] as const
export type ViewType = (typeof viewTypes)[number] | string

// View ID constants
export const WORKING_VIEW_ID = '_working_' as const
export const NEW_VIEW_ID = '_new_view_' as const
export const BASE_VIEW_ID = '__base__' as const