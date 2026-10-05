import { ShareOption as ShareOptionType } from '@shared/api/generated/access'
import {
  EVERY_GUESTS_KEY,
  EVERYONE_GROUP_KEY,
} from '@shared/components/ShareOptionIcon/ShareOptionIcon'

// Default share options that are always available
export const DEFAULT_SHARE_OPTIONS: ShareOptionType[] = [
  {
    label: 'Everyone',
    value: EVERYONE_GROUP_KEY,
    shareType: 'global',
    name: EVERYONE_GROUP_KEY,
  },
  { label: 'All Guests', value: EVERY_GUESTS_KEY, shareType: 'global', name: EVERY_GUESTS_KEY },
]

export const ACCESS_LEVEL_LABELS = {
  0: 'No access',
  10: 'Viewer',
  20: 'Editor',
  30: 'Admin',
}
