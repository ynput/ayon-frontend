import { FC } from 'react'
import type { EntityList } from '@shared/api'
import type { ListPickerProps } from '../../listValues/types'
import { COMPARE_TOO_MANY_ITEMS, isTooBigToCompare } from '../../listValues/compareLimit'
import { ListPicker } from './ListPicker'

// the picker's own list record: it also shows the lists the sidebar's filters hide
const tooBigToCompare = (list: EntityList) =>
  isTooBigToCompare(list) ? COMPARE_TOO_MANY_ITEMS : undefined

// The list picker for the compare dialog: lists too big to compare can't be picked
export const CompareListPicker: FC<ListPickerProps> = (props) => (
  <ListPicker {...props} isListDisabled={tooBigToCompare} />
)
