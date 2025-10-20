import { FC } from 'react'
import { ProjectTableSettings, SettingConfig } from '@shared/components'
import { SizeSlider } from '@shared/components'
import { useVersionsViewsContext } from '../../context/VersionsViewsContext'

export interface ProductsAndVersionsSettingsProps {}

export const ProductsAndVersionsSettings: FC<ProductsAndVersionsSettingsProps> = ({}) => {
  const { gridHeight, onUpdateGridHeight, onUpdateGridHeightWithPersistence } =
    useVersionsViewsContext()

  const extraColumns = [
    {
      value: 'author',
      label: 'Author',
    },
  ]

  const extraSettings: SettingConfig[] = [
    {
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
  ]

  return (
    <ProjectTableSettings
      extraColumns={extraColumns}
      settings={extraSettings}
      includeLinks={false}
    />
  )
}
