import { expect, test } from '@playwright/test'
import { ADDON_COLUMN_PREFIX, addonColumnId } from '../../addon/src/tableColumns'
import {
  getAddonColumnId,
  isAddonColumnId,
} from '../../shared/src/containers/ProjectTreeTable/addonColumns/addonColumnsHelpers'

test('an addon column id is addon__<addon>__<id>, with the addon name made safe', () => {
  expect(ADDON_COLUMN_PREFIX).toBe('addon__')
  expect(addonColumnId('timetracker', 'time_logged')).toBe('addon__timetracker__time_logged')
  expect(addonColumnId('my-addon.v2', 'col')).toBe('addon__my_addon_v2__col')
})

test('the host builds the same id and recognises it', () => {
  const column = { addon: { name: 'my-addon' }, id: 'col' } as never
  expect(getAddonColumnId(column)).toBe(addonColumnId('my-addon', 'col'))
  expect(isAddonColumnId(addonColumnId('a', 'b'))).toBe(true)
  expect(isAddonColumnId('name')).toBe(false)
})
