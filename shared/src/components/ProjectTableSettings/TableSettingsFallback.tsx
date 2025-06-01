import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'
import { PowerpackButton, PowerpackButtonProps } from '../Powerpack'

export interface TableSettingsFallbackProps
  extends Omit<PowerpackButtonProps, 'onError' | 'onChange'> {
  requiredVersion: string | undefined
}

export const TableSettingsFallback: FC<TableSettingsFallbackProps> = ({
  requiredVersion,
  feature,
  label,
}) => {
  if (requiredVersion) {
    return (
      <>
        <span>{`Powerpack version ${requiredVersion} is required to use this feature.`}</span>
        <Link to={`/market?selected=powerpack`} style={{ marginLeft: '8px' }}>
          <Button variant="tertiary">Install Powerpack {requiredVersion}</Button>
        </Link>
      </>
    )
  }

  return (
    <PowerpackButton
      style={{ width: '100%' }}
      icon={'add'}
      feature={feature}
      label={label}
      filled
    />
  )
}
