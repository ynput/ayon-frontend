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

const ScopeIconStyled = styled(Icon)<{ $color?: string }>`
  border-radius: 50%;
  transition: background-color 0.2s ease, opacity 0.2s ease;
  background-color: ${({ $color }) => $color ? `${$color}20` : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  ${ClickableIconWrapper}:hover & {
    background-color: ${({ $color }) => $color || 'var(--md-sys-color-surface-container-highest)'};
  }
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

    if(!isStudioScope && !powerLicense ){
      setPowerpackDialog('sharedViews')
      return
    }

    if (existingBase) {
      confirmDialog({
        message: `Do you want to delete default view`,
        header: `Delete default view`,
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        accept: async () => {
          await onDeleteBaseView(existingBase.id as string, isStudioScope)
        }
      })
    } else {
      await onCreateBaseView(isStudioScope)
    }
  }

  return (
    <>
      <ScopeIcon
        existingView={!!studioBaseView}
        label={'Studio'}
        onClick={() => handleBaseViewAction(true)}
        color={'var(--md-sys-color-tertiary)'}
      />
      <ScopeIcon
        existingView={!!projectBaseView}
        label={'Project'}
        onClick={() => handleBaseViewAction(false)}
        poweLicense={powerLicense}
        color={'orange'}
      />
    </>
  )
}

type ScopeIconProps = {
  existingView: boolean
  onClick: () => void
  label: string
  poweLicense?: boolean
  color?: string
}

const ScopeIcon: FC<ScopeIconProps> = ({
  existingView,
  onClick,
  label,
  poweLicense = undefined,
  color
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <Styled.ViewChip
      label={label}
      $active={existingView}
      icon={
        <ClickableIconWrapper onClick={handleClick}>
          {poweLicense === false ? (
            <PowerIcon icon="bolt" />
          ) : (
            <ScopeIconStyled $color={color} icon={existingView ? 'close' : 'add'} />
          )}
        </ClickableIconWrapper>
      }
    />
  )
}
