import { FC } from 'react'
import { ProjectTableSettings, SettingConfig } from '@shared/components'
import { SizeSlider } from '@shared/components'
import { useVersionsViewsContext } from '../../context/VersionsViewsContext'
import ProductsAndVersionsSorting from './ProductsAndVersionsSorting'
import { FeaturedVersionOrder, FEATURED_VERSION_TYPES } from '@shared/components'
import { useProjectDataContext, useProjectTableContext } from '@shared/containers'

export interface ProductsAndVersionsSettingsProps {}

export const ProductsAndVersionsSettings: FC<ProductsAndVersionsSettingsProps> = ({}) => {
  const {
    gridHeight,
    onUpdateGridHeight,
    onUpdateGridHeightWithPersistence,
    sortBy,
    sortDesc,
    onUpdateSorting,
    featuredVersionOrder,
    onUpdateFeaturedVersionOrder,
  } = useVersionsViewsContext()

  // const { attribFields } = useProjectDataContext()
  const { attribFieldsScoped } = useProjectTableContext()

  const extraColumns = [
    {
      value: 'author',
      label: 'Author',
    },
    {
      value: 'version',
      label: 'Version',
    },
  ]

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
      id: 'sort-by',
      component: (
        <ProductsAndVersionsSorting
          sortBy={sortBy}
          sortDesc={sortDesc}
          attributes={attribFieldsScoped}
          onUpdateSorting={onUpdateSorting}
        />
      ),
    },
    {
      id: 'featured-version-order',
      title: 'Featured version',
      icon: 'layers',
      preview:
        FEATURED_VERSION_TYPES.find((option) => option.value === featuredVersionOrder[0])?.short ||
        '',
      component: (
        <FeaturedVersionOrder
          value={featuredVersionOrder}
          onChange={onUpdateFeaturedVersionOrder}
        />
      ),
    },
  ]

  return (
    <ProjectTableSettings
      extraColumns={extraColumns}
      settings={extraSettings}
      includeLinks={false}
      order={['columns', 'featured-version-order', 'sort-by', 'row-height', 'grid-size']}
    />
  )
}
