import { ListValuesUpsell } from './ListValuesUpsell'
import { communityListValueRules } from './communityListValueRules'
import { LIST_VALUES_API_VERSION, type CompareView, type ListValuesModule } from './types'

const NO_COMPARE_VIEW: CompareView<never> = {
  compareWith: null,
  comparedList: null,
  setCompareWith: () => {},
  compareWithList: () => {},
  marks: new Map(),
  compareOnlyItems: [],
  refetchCompareOnly: () => {},
}

// The fallback for the powerpack's ListValues module, see AGENTS.md
export const communityListValues: ListValuesModule = {
  apiVersion: LIST_VALUES_API_VERSION,
  Controls: ListValuesUpsell,
  CompareSettings: () => null,
  getCompareSettingsPreview: () => undefined,
  ...communityListValueRules,
  useCompareView: () => NO_COMPARE_VIEW,
  getCellMenuItems: () => [],
  getColumnMenuItems: () => [],
  getListMenuItems: (list, shownList) =>
    shownList && list.id !== shownList.id && list.entityType === shownList.entityType
      ? [{ label: 'Compare with current list', icon: 'compare_arrows', powerFeature: 'listValues' }]
      : [],
}
