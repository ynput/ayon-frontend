import { FC } from 'react'
import { ProjectTableSettings, SettingConfig } from '@shared/components'
import { SettingSwitch } from '@shared/components/ProjectTableSettings/ColumnsSettings'
import { SizeSlider } from '@shared/components'
import { useVPViewsContext } from '../../context/vp-views'
import { FeaturedVersionOrder, FEATURED_VERSION_TYPES } from '@shared/components'
import { VP_COLUMN_ID_ALIASES, VP_EXTRA_COLUMNS, VP_PARENT_COLUMNS } from './VPTableSettingsHelpers'

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
