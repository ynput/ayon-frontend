import { CreateViewApiArg } from '@shared/api'
import { v4 as uuidv4 } from 'uuid'

export const generatePersonalView = (
  settings: CreateViewApiArg['payload']['settings'] = {},
): CreateViewApiArg['payload'] => ({
  id: uuidv4().replace(/-/g, ''),
  label: 'Personal',
  personal: true,
  settings,
})
