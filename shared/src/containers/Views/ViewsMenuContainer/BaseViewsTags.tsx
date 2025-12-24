import { FC } from 'react'
import * as Styled from '@shared/containers/Views/Views.styled'
import { useViewsContext } from '@shared/containers'
import { confirmDialog } from 'primereact/confirmdialog'
import { usePowerpack } from '@shared/context'
import { SectionHeader } from '@shared/containers/Views/ViewsMenu/SectionHeader'
import { useLocalStorage } from '@shared/hooks'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

type BaseViewsTagContainerProps = {
  projectName?: string | undefined
}

const BaseViewsTagContainer: FC<BaseViewsTagContainerProps> = ({ projectName }) => {
  const {
    projectBaseView,
    studioBaseView,
    onCreateBaseView,
    onDeleteBaseView,
    onUpdateWorkingView,
  } = useViewsContext()

  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const [collapsed, setCollapsed] = useLocalStorage('collapsed-default-view', false)

  const handleBaseViewAction = async (isStudioScope: boolean, remove?: boolean) => {
    const existingBase = isStudioScope ? studioBaseView : projectBaseView

    const disabled = !isStudioScope && powerLicense === false
    if (disabled && !remove) {
      setPowerpackDialog('sharedViews')
      return
    }

    if (existingBase) {
      if (remove || disabled) {
        // remove button clicked, ask to remove the base view
        confirmDialog({
          message: `Are you sure you want to remove this default view?`,
          header: `Remove Default View`,
          acceptLabel: 'Remove',
          rejectLabel: 'Cancel',
          accept: async () => {
            await onDeleteBaseView(existingBase.id as string, isStudioScope)
          },
        })
      } else {
        // set the working view to the existing base view
        // @ts-expect-error settings exists
        onUpdateWorkingView({ settings: existingBase.settings }, { selectView: true })
      }
    } else {
      // create new base view
      await onCreateBaseView(isStudioScope)
    }
  }

  return (
    <>
      <SectionHeader
        onClick={() => setCollapsed(!collapsed)}
        collapsed={collapsed}
        id="default-views"
        title="Default views"
        style={{ marginBottom: '10px' }}
      />
      {!collapsed && (
        <Styled.BaseViewsContainer>
          <ScopeIcon
            existingView={!!studioBaseView}
            label={'Studio'}
            onClick={(r) => handleBaseViewAction(true, r)}
          />
          {projectName && (
            <ScopeIcon
              existingView={!!projectBaseView}
              label={'Project'}
              onClick={(r) => handleBaseViewAction(false, r)}
              powerLicense={powerLicense}
            />
          )}
        </Styled.BaseViewsContainer>
      )}
    </>
  )
}
export default BaseViewsTagContainer

type ScopeIconProps = {
  existingView: boolean
  onClick: (remove?: boolean) => void
  label: string
  powerLicense?: boolean
}

const ScopeIcon: FC<ScopeIconProps> = ({
  existingView,
  onClick,
  label,
  powerLicense = undefined,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(true)
  }

  return (
    <Styled.ViewButton
      className={clsx({
        ['powerpack-locked']: powerLicense === false,
        ['active']: existingView,
      })}
      onClick={handleClick}
    >
      <Icon
        icon={powerLicense === false ? 'bolt' : existingView ? 'close' : 'add'}
        onClick={(e) => existingView && handleRemove(e)}
      />
      {label}
    </Styled.ViewButton>
  )
}
