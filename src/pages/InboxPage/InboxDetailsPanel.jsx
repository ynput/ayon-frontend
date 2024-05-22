// mainly just a wrapper for data fetching

import { useMemo } from 'react'
import DetailsPanel from '/src/containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import { useGetProjectQuery } from '/src/services/project/getProject'

const InboxDetailsPanel = ({ messages = [], selected = [] }) => {
  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.activityId === selected[0]) || {}
  }, [messages, selected])

  const { projectName, origin: { type: entityType, id: entityId } = {} } = selectedMessage

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const { data: projectInfo = {} } = useGetProjectQuery({ projectName }, { skip: !projectName })

  if (!selected.length) return null

  return (
    <DetailsPanel
      entities={[{ id: entityId, projectName, entityType: entityType }]}
      statusesOptions={projectInfo.statuses || []}
      tagsOptions={projectInfo.tags || []}
      projectUsers={users}
      activeProjectUsers={users}
      disabledProjectUsers={[]}
      projectsInfo={{ [projectName]: projectInfo }}
      projectNames={[projectName]}
      entityType={entityType}
      scope="dashboard"
    />
  )
}

export default InboxDetailsPanel
