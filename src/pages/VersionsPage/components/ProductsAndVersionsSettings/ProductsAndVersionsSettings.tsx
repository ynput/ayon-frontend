import { FC } from 'react'
import { ProjectTableSettings } from '@shared/components'

export interface ProductsAndVersionsSettingsProps {}

export const ProductsAndVersionsSettings: FC<ProductsAndVersionsSettingsProps> = ({}) => {
  const extraColumns = [
    {
      value: 'author',
      label: 'Author',
    },
  ]

  return <ProjectTableSettings extraColumns={extraColumns} includeLinks={false} />
}
