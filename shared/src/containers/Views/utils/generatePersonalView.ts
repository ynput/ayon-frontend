import { CreateViewApiArg } from '@shared/api'
import { v4 as uuidv4 } from 'uuid'

export const generateViewId = (): string => uuidv4().replace(/-/g, '')

export const generatePersonalView = (
  settings: CreateViewApiArg['payload']['settings'] = {},
): CreateViewApiArg['payload'] => ({
  id: generateViewId(),
  label: 'Personal',
  personal: true,
  settings,
})
