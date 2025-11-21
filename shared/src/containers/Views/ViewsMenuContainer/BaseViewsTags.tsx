import { FC } from 'react'
import * as Styled from '@shared/containers/Views/Views.styled'
import { Icon } from '@ynput/ayon-react-components'
import { useViewsContext } from '@shared/containers'
import styled from 'styled-components'
import { confirmDialog } from 'primereact/confirmdialog'
import { usePowerpack } from '@shared/context'

const PowerIcon = styled(Icon)`
  color: var(--md-sys-color-tertiary);
  font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
`

const ClickableIconWrapper = styled.span`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s ease;
  color: var(--md-sys-color-outline);
`

export const BaseViewsTagContainer: FC = () => {
  const {
    projectBaseView,
    studioBaseView,
    onCreateBaseView,
    onUpdateBaseView,
    onDeleteBaseView,
  } = useViewsContext()

  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const handleBaseViewAction = async (isStudioScope: boolean) => {
    const existingBase = isStudioScope ? studioBaseView : projectBaseView
    const scope = isStudioScope ? 'Studio' : 'Project'

    if(!isStudioScope && !powerLicense ){
      setPowerpackDialog('sharedViews')
      return
    }

    if (existingBase) {
      // Show confirm dialog with options to update or remove
      confirmDialog({
        message: `Choose an action for the ${scope} default view`,
        header: `Manage ${scope} Default View`,
        acceptLabel: 'Update',
        rejectLabel: 'Remove',
        accept: async () => {
          await onUpdateBaseView(existingBase.id as string, isStudioScope)
        },
        reject: async () => {
          await onDeleteBaseView(existingBase.id as string, isStudioScope)
        },
      })
    } else {
      // Create new base view
      await onCreateBaseView(isStudioScope)
    }
  }

  return (
    <>
      <ScopeIcon
        existingView={!!studioBaseView}
        label={'Studio'}
        onClick={() => handleBaseViewAction(true)}
      />
      <ScopeIcon
        existingView={!!projectBaseView}
        label={'Project'}
        onClick={() => handleBaseViewAction(false)}
        poweLicense={powerLicense}
      />
    </>
  )
}

type ScopeIconProps = {
  existingView: boolean
  onClick: () => void
  label: string
  poweLicense?: boolean
}

const ScopeIcon: FC<ScopeIconProps> = ({
  existingView,
  onClick,
  label,
  poweLicense = undefined,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <Styled.ViewChip
      label={label}
      icon={
        <ClickableIconWrapper onClick={handleClick}>
          {poweLicense === false ? (
            <PowerIcon icon="bolt" />
          ) : (
            <Icon icon={existingView ? 'close' : 'add'} />
          )}
        </ClickableIconWrapper>
      }
    />
  )
}
