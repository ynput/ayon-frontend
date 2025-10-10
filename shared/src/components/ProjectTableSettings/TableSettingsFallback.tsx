import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { Link } from 'react-router-dom'
import { PowerpackButton, PowerpackButtonProps } from '../Powerpack'
import { PowerpackFeature, usePowerpack } from '@shared/context'
import { RequiredPowerpackVersion } from '../Powerpack/RequiredPowerpackVersion'

export interface TableSettingsFallbackProps {
  requiredVersion: string | undefined
  feature: PowerpackFeature
  button?: Omit<PowerpackButtonProps, 'feature'>
  children?: React.ReactNode
}

export const TableSettingsFallback: FC<TableSettingsFallbackProps> = ({
  requiredVersion,
  feature,
  button,
  children,
}) => {
  const { setPowerpackDialog } = usePowerpack()
  if (requiredVersion) {
    return <RequiredPowerpackVersion requiredVersion={requiredVersion} />
  }

  return (
    <>
      {!!button && (
        <PowerpackButton
          style={{ width: '100%' }}
          icon={'add'}
          filled
          {...button}
          feature={feature}
        />
      )}
      {/* press anything inside children and we get powerpack popup */}
      <div onClick={() => setPowerpackDialog(feature)}>{children}</div>
    </>
  )
}
