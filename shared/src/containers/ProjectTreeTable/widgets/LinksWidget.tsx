import { Chips } from '@shared/components/Chips/Chips'
import { FC } from 'react'

export interface LinksWidgetProps {
  value: string[]
}

export const LinksWidget: FC<LinksWidgetProps> = ({ value }) => {
  return <Chips values={value} />
}
