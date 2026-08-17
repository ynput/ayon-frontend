import { FC } from 'react'
import { ProjectTableSettings, SettingConfig } from '@shared/components'
import { SettingSwitch } from '@shared/components/ProjectTableSettings/ColumnsSettings'
import { SizeSlider } from '@shared/components'
import { useVPViewsContext } from '../../context/VPViewsContext'
import { FeaturedVersionOrder, FEATURED_VERSION_TYPES } from '@shared/components'
import { ENTITY_COLUMN_IDS, getColumnLabel } from '@shared/containers'
import type { ParentColumnDefinition } from '@shared/containers'

export const VP_PARENT_COLUMNS: ParentColumnDefinition[] = [
  {
    id: 'folder_status',
    scope: 'folder',
    field: 'status',
    label: 'Folder status',
    optionKey: 'folderStatus',
    readOnly: false,
    updateField: 'status',
  },
  {
    id: 'folder_subType',
    scope: 'folder',
    field: 'subType',
    label: 'Folder type',
    optionKey: 'folderType',
    updateField: 'folderType',
  },
  {
    id: 'folder_tags',
    scope: 'folder',
    field: 'tags',
    label: 'Folder tags',
    optionKey: 'tag',
    dataType: 'list_of_strings',
  },
  {
    id: 'folder_updatedAt',
    scope: 'folder',
    field: 'updatedAt',
    label: 'Folder updated at',
    dataType: 'datetime',
  },
  {
    id: 'folder_createdAt',
    scope: 'folder',
    field: 'createdAt',
    label: 'Folder created at',
    dataType: 'datetime',
  },
  {
    id: 'task_subType',
    scope: 'task',
    field: 'subType',
    label: 'Task type',
    optionKey: 'taskType',
    updateField: 'taskType',
  },
  {
    id: 'task_status',
    scope: 'task',
    field: 'status',
    label: 'Task status',
    optionKey: 'taskStatus',
    readOnly: false,
  },
  {
    id: 'product_productBaseType',
    scope: 'product',
    field: 'productBaseType',
    label: 'Product base type',
    fallbackToPrimary: true,
  },
]

export const VP_COLUMN_ID_ALIASES = {
  productBaseType: 'product_productBaseType',
  taskType: 'task_subType',
  folderType: 'folder_subType',
  folderStatus: 'folder_status',
  taskLabel: 'task_entity',
}

export const VP_EXTRA_COLUMNS = [
  {
    value: 'author',
    label: getColumnLabel('author'),
  },
  {
    value: 'version',
    label: getColumnLabel('version'),
  },
  {
    value: ENTITY_COLUMN_IDS.version,
    label: getColumnLabel(ENTITY_COLUMN_IDS.version),
  },
]

export interface VPTableSettingsProps {}

export const VPTableSettings: FC<VPTableSettingsProps> = ({}) => {
  const {
    gridHeight,
    onUpdateGridHeight,
    onUpdateGridHeightWithPersistence,
    latestPerFolder,
    onUpdateLatestPerFolder,
    showProducts,
    featuredVersionOrder,
    onUpdateFeaturedVersionOrder,
  } = useVPViewsContext()

  const extraColumns = VP_EXTRA_COLUMNS

  const extraSettings: SettingConfig[] = [
    {
      id: 'grid-size',
      component: (
        <SizeSlider
          value={gridHeight}
          onChange={onUpdateGridHeight}
          onChangeComplete={onUpdateGridHeightWithPersistence}
          title="Grid size"
          id="grid-size-slider"
          min={90}
          max={300}
          step={10}
        />
      ),
    },
    {
      id: 'featured-version-order',
      title: 'Featured version',
      icon: 'layers',
      preview:
        FEATURED_VERSION_TYPES.find((option) => option.value === featuredVersionOrder[0])?.label ||
        '',
      component: (
        <FeaturedVersionOrder
          value={featuredVersionOrder}
          onChange={onUpdateFeaturedVersionOrder}
        />
      ),
    },
    {
      id: 'latest-per-folder',
      component: (
        <SettingSwitch
          icon="folder"
          label="Latest per folder"
          disabled={showProducts}
          data-tooltip={
            showProducts
              ? 'Disabled when grouping by product'
              : 'Show only the latest published version per folder (1 version per folder).'
          }
          checked={latestPerFolder === true && !showProducts}
          onChange={onUpdateLatestPerFolder}
        />
      ),
    },
  ]

  return (
    <ProjectTableSettings
      extraColumns={extraColumns}
      parentColumns={VP_PARENT_COLUMNS}
      settings={extraSettings}
      includeLinks={false}
      scope="version"
      columnIdAliases={VP_COLUMN_ID_ALIASES}
      order={[
        'columns',
        'sort-by',
        'group-by',
        'featured-version-order',
        'row-height',
        'grid-size',
      ]}
    />
  )
}
