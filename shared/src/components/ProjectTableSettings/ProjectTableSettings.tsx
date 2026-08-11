import {
  useColumnSettingsContext,
  useProjectTableContext,
  checkColumnVisibility,
} from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC, useEffect, useState } from 'react'
import styled from 'styled-components'
import { SettingHighlightedId, useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import { ColumnsSettingsWithContext } from './ColumnsSettings'
import { SizeSlider } from '@shared/components'
import { useGroupBySettings } from '@shared/containers/ProjectTreeTable/hooks/useGroupBySettings'
import { useSortBySettings } from '@shared/containers/ProjectTreeTable/hooks/useSortBySettings'
import { useAddColumnsMenu } from './useAddColumnsMenu'
import { useProjectTableColumnItems } from './useProjectTableColumnItems'
import type { MenuItemType } from '../Menu'

const StyledCustomizeButton = styled(Button)`
  min-width: 120px;
`

const HeaderActionButton = styled(Button)`
  padding: 4px !important;
`

interface Props extends ButtonProps {
  defaultSelected?: string | null
}

export const CustomizeButton = ({ defaultSelected, className, ...props }: Props) => {
  const { togglePanel, isPanelOpen } = useSettingsPanel()

  return (
    <StyledCustomizeButton
      onClick={() => togglePanel(defaultSelected)}
      icon="settings"
      selected={isPanelOpen}
      {...props}
    >
      Customize
    </StyledCustomizeButton>
  )
}

export type OverviewSettingsChange = (setting: 'columns' | 'group-by', value: any) => void

export type ProjectTableSettingsProps = {
  settings?: SettingConfig[]
  extraColumns?: { value: string; label: string }[]
  hiddenColumns?: string[]
  hiddenSettings?: ('columns' | 'row-height' | 'group-by' | 'sort-by')[]
  highlighted?: SettingHighlightedId
  includeLinks?: boolean
  hideSortBy?: boolean
  order?: string[]
  scope?: string
  // page actions appended to the end of the add-column menu
  extraMenuItems?: MenuItemType[]
}

export const ProjectTableSettings: FC<ProjectTableSettingsProps> = ({
  settings = [],
  extraColumns,
  hiddenColumns,
  hiddenSettings = [],
  highlighted,
  includeLinks = true,
  hideSortBy = false,
  order,
  scope,
  extraMenuItems,
}) => {
  const { scopes } = useProjectTableContext()
  const {
    columnVisibility,
    defaultColumnVisibility,
    rowHeight = 34,
    updateRowHeight,
    updateRowHeightWithPersistence,
  } = useColumnSettingsContext()

  const { isPanelOpen, selectedSetting } = useSettingsPanel()

  const [search, setSearch] = useState<string | null>(null)

  useEffect(() => {
    if (search === null) return
    if (!isPanelOpen || selectedSetting !== 'columns') setSearch(null)
  }, [isPanelOpen, selectedSetting, search])

  // a different entity scope (switching lists) means a different column set
  const scopeKey = `${scope ?? ''}:${scopes.join()}`
  useEffect(() => {
    setSearch(null)
  }, [scopeKey])

  const { columns, visibleColumns } = useProjectTableColumnItems({
    extraColumns,
    hiddenColumns,
    includeLinks,
  })

  const visibleCount = visibleColumns.filter((column) =>
    checkColumnVisibility(columnVisibility, column.value, defaultColumnVisibility),
  ).length

  const { menuItems: addColumnMenuItems } = useAddColumnsMenu({
    columns: visibleColumns,
    scopes,
    extraItems: extraMenuItems,
  })

  const groupBySettings = useGroupBySettings({ scope })
  const sortBySettings = useSortBySettings(columns)

  const defaultSettings: (SettingConfig | undefined | null)[] = [
    {
      id: 'columns',
      title: 'Columns',
      icon: 'view_column',
      preview: `${visibleCount}/${visibleColumns.length}`,
      headerActions: (
        <HeaderActionButton
          variant="text"
          icon="search"
          data-tooltip="Search columns"
          selected={typeof search === 'string'}
          onClick={() => setSearch(typeof search === 'string' ? null : '')}
        />
      ),
      component: (
        <ColumnsSettingsWithContext
          columns={visibleColumns}
          highlighted={highlighted}
          scopes={scopes}
          search={search}
          onSearchChange={setSearch}
          addColumnMenuItems={addColumnMenuItems}
        />
      ),
    },
    hideSortBy ? null : sortBySettings,
    groupBySettings,
    {
      id: 'row-height',
      component: (
        <SizeSlider
          value={rowHeight}
          onChange={updateRowHeight}
          onChangeComplete={updateRowHeightWithPersistence}
          title="Row height"
          id="row-height-slider"
        />
      ),
    },
  ].filter(Boolean)

  // Merge extra settings: replace defaults with matching ids, append the rest
  settings.forEach((setting) => {
    if (hiddenSettings.includes(setting.id as any)) return
    const existingIndex = defaultSettings.findIndex((s) => s && 'id' in s && s.id === setting.id)
    if (existingIndex !== -1) {
      defaultSettings[existingIndex] = setting
    } else {
      defaultSettings.push(setting)
    }
  })
  return <SettingsPanel settings={defaultSettings as SettingConfig[]} order={order} />
}
