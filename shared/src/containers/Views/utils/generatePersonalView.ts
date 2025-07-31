import { CreateViewApiArg } from '@shared/api'
import { v4 as uuidv4 } from 'uuid'
import { ViewType } from '../Views'

export const generatePersonalView = (viewType: ViewType): CreateViewApiArg['payload'] => ({
  id: uuidv4().replace(/-/g, ''),
  label: 'Personal',
  settings: {},
  personal: true,
  visibility: 'private',
  viewType,
})
