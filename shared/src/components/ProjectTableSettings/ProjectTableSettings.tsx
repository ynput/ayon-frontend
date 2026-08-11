import {
  useColumnSettingsContext,
  useProjectTableContext,
  checkColumnVisibility,
} from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { SettingHighlightedId, useMenuContext, useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import { ColumnsSettingsWithContext } from './ColumnsSettings'
import { SizeSlider } from '@shared/components'
import { useGroupBySettings } from '@shared/containers/ProjectTreeTable/hooks/useGroupBySettings'
import { useSortBySettings } from '@shared/containers/ProjectTreeTable/hooks/useSortBySettings'
import { useAddColumnsMenu } from './useAddColumnsMenu'
import { useProjectTableColumnItems } from './useProjectTableColumnItems'
import { AddColumnMenu } from './AddColumnMenu'
import type { MenuItemType } from '../Menu'

const ADD_COLUMN_MENU_HEADER_ID = 'add-column-menu-header'

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
  extraColumns = [],
  hiddenColumns = [],
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

  const { toggleMenuOpen } = useMenuContext()

  const { columns, visibleColumns } = useProjectTableColumnItems({
    extraColumns,
    hiddenColumns,
    includeLinks,
  })

  const visibleCount = visibleColumns.filter((column) =>
    checkColumnVisibility(columnVisibility, column.value, defaultColumnVisibility),
  ).length

  const { menuItems: addColumnMenuItems, hasColumnsToAdd } = useAddColumnsMenu({
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
        <>
          <HeaderActionButton
            variant="text"
            icon="add"
            id={ADD_COLUMN_MENU_HEADER_ID}
            data-tooltip="Add column"
            disabled={!hasColumnsToAdd}
            onClick={() => toggleMenuOpen(ADD_COLUMN_MENU_HEADER_ID)}
          />
          <AddColumnMenu menuId={ADD_COLUMN_MENU_HEADER_ID} menuItems={addColumnMenuItems} />
        </>
      ),
      component: (
        <ColumnsSettingsWithContext
          columns={visibleColumns}
          highlighted={highlighted}
          addColumnMenuItems={addColumnMenuItems}
          addColumnMenuId={ADD_COLUMN_MENU_HEADER_ID}
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
