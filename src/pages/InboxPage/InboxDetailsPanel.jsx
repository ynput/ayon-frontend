// mainly just a wrapper for data fetching

import { useMemo } from 'react'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'

const InboxDetailsPanel = ({ messages = [], selected = [], projectsInfo = {}, onClose }) => {
  const user = useSelector((state) => state.user.name)
  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.activityId === selected[0]) || {}
  }, [messages, selected])

  const dispatch = useAppDispatch()
  const handleOpenViewer = (args) => dispatch(openViewer(args))

  const { projectName, entityType, entityId, entitySubType } = selectedMessage

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}

  if (!selected.length) return null

  return (
    <div className="inbox-details-panel">
      <EntityListsContextBoundary projectName={projectName}>
        {(entityListsContext) => (
          <>
            <DetailsPanel
              entities={[{ id: entityId, projectName, entityType: entityType }]}
              tagsOptions={projectInfo.tags || []}
              projectUsers={users}
              activeProjectUsers={users}
              disabledProjectUsers={[]}
              projectsInfo={projectsInfo}
              projectNames={[projectName]}
              onClose={onClose}
              entityType={entityType}
              entitySubTypes={entitySubType ? [entitySubType] : null}
              scope="inbox"
              onWatchersUpdate={(added) => {
                if (added.includes(user)) {
                  const name = selectedMessage.messages[0].origin.name
                  toast.success(
                    `All future updates for ${name} will appear in your important inbox.`,
                  )
                }
              }}
              style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
              onOpenViewer={handleOpenViewer}
              entityListsContext={entityListsContext}
            />
            <DetailsPanelSlideOut
              projectsInfo={projectsInfo}
              scope="inbox"
              entityListsContext={entityListsContext}
            />
          </>
        )}
      </EntityListsContextBoundary>
    </div>
  )
}

export default InboxDetailsPanel
