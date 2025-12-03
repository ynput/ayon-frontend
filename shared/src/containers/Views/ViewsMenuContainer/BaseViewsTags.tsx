import { FC } from 'react'
import * as Styled from '@shared/containers/Views/Views.styled'
import { useViewsContext } from '@shared/containers'
import { confirmDialog } from 'primereact/confirmdialog'
import { usePowerpack } from '@shared/context'
import { SectionHeader } from '@shared/containers/Views/ViewsMenu/SectionHeader'
import { useLocalStorage } from '@shared/hooks'


const BaseViewsTagContainer: FC = () => {
  const {
    projectBaseView,
    studioBaseView,
    onCreateBaseView,
    onDeleteBaseView,
  } = useViewsContext()

  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const [collapsed, setCollapsed] = useLocalStorage('collapsed-default-view', false)

  const handleBaseViewAction = async (isStudioScope: boolean) => {
    const existingBase = isStudioScope ? studioBaseView : projectBaseView

    if(!isStudioScope && !powerLicense ){
      setPowerpackDialog('sharedViews')
      return
    }

    if (existingBase) {
      confirmDialog({
        message: `Are you sure you want to remove this default view?`,
        header: `Remove Default View`,
        acceptLabel: 'Remove',
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
    <Styled.BaseViewsContainer>
      <SectionHeader
        onClick={() => setCollapsed(!collapsed)}
        collapsed={collapsed}
        id="default-views"
        title="Default views"
        style={{marginBottom: '10px'}}
      />
      {!collapsed && (
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
      )}
    </Styled.BaseViewsContainer>
  )
}
export default BaseViewsTagContainer

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
    <Styled.ViewButton
      label={label}
      className={existingView ? 'active' : ''}
      onClick={handleClick}
      icon={ poweLicense === false ? "bolt":  existingView ? 'close' : 'add'}
    />
  )
}
