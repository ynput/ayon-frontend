import { ReactNode, MouseEvent } from 'react'
import { ObjectFieldTemplateProps } from '@rjsf/utils'
import SettingsPanel from '../SettingsPanel'
import { SettingsGroup } from '../SettingsGroup/SettingsGroup'
import SearchHidden from './SearchHidden'

type FieldsRenderer = (lead?: ReactNode) => ReactNode

type ObjectFieldTemplateViewProps = {
  objId: string
  isRoot: boolean
  flatLayout: boolean
  matches: boolean
  title: ReactNode
  groupDescription?: string
  shortDescription?: string
  overrideLevel: string
  enabledToggler: ReactNode
  onContextMenu: (e: MouseEvent) => void
  onGroupClick: () => void
  currentId: ObjectFieldTemplateProps['formContext']['currentId']
  fields: FieldsRenderer
}

const ObjectFieldTemplateView = ({
  objId,
  isRoot,
  flatLayout,
  matches,
  title,
  groupDescription,
  shortDescription,
  overrideLevel,
  enabledToggler,
  onContextMenu,
  onGroupClick,
  currentId,
  fields,
}: ObjectFieldTemplateViewProps) => (
  <SearchHidden matches={matches} schemaId={objId}>
    {flatLayout ? (
      <SettingsGroup
        objId={objId}
        isRoot={isRoot}
        onClick={onGroupClick}
        title={title}
        description={groupDescription}
        className={`obj-override-${overrideLevel}`}
        enabledToggler={enabledToggler}
        onContextMenu={onContextMenu}
      >
        {fields}
      </SettingsGroup>
    ) : (
      <SettingsPanel
        objId={objId}
        onClick={onGroupClick}
        title={title}
        description={shortDescription}
        className={`obj-override-${overrideLevel}`}
        enabledToggler={enabledToggler}
        onContextMenu={onContextMenu}
        currentId={currentId}
        layout={undefined}
      >
        {fields()}
      </SettingsPanel>
    )}
  </SearchHidden>
)

export default ObjectFieldTemplateView
