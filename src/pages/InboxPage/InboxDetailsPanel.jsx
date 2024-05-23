// mainly just a wrapper for data fetching

import { useMemo } from 'react'
import DetailsPanel from '/src/containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'

const InboxDetailsPanel = ({ messages = [], selected = [], projectsInfo = {}, onClose }) => {
  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.activityId === selected[0]) || {}
  }, [messages, selected])

  const { projectName, entityType, entityId } = selectedMessage

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}

  if (!selected.length) return null

  return (
    <DetailsPanel
      entities={[{ id: entityId, projectName, entityType: entityType }]}
      statusesOptions={projectInfo.statuses || []}
      tagsOptions={projectInfo.tags || []}
      projectUsers={users}
      activeProjectUsers={users}
      disabledProjectUsers={[]}
      projectsInfo={projectsInfo}
      projectNames={[projectName]}
      entityType={entityType}
      scope="dashboard"
      style={{ boxShadow: 'none' }}
      onClose={onClose}
    />
  )
}

export default InboxDetailsPanel
