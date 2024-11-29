import { useState } from 'react'
import AccessGroupList from './AccessGroupList'
import AccessGroupDetail from './AccessGroupDetail'
import { AccessGroupObject } from '@api/rest/accessGroups'

type Props = {
  projectName?: string
  canCreateOrDelete?: boolean
}

const AccessGroups = ({ projectName, canCreateOrDelete }: Props) => {
  const [selectedAccessGroup, setSelectedAccessGroup] = useState<AccessGroupObject | null>(null)

  return (
    <main style={{display: 'flex', flexGrow: 1}}>
      <AccessGroupList
        canCreateOrDelete={canCreateOrDelete}
        projectName={projectName}
        selectedAccessGroup={selectedAccessGroup}
        onSelectAccessGroup={setSelectedAccessGroup}
      />

      <AccessGroupDetail projectName={projectName} accessGroupName={selectedAccessGroup?.name} />
    </main>
  )
}

export default AccessGroups
