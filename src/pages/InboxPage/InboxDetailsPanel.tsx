// mainly just a wrapper for data fetching

import { useMemo } from 'react'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '@state/store'
import { openViewer } from '@state/viewer'
import type { GroupedMessage, ProjectsInfo } from './types'

interface InboxDetailsPanelProps {
  messages?: GroupedMessage[]
  selected?: string[]
  projectsInfo?: ProjectsInfo
  onClose: () => void
}

const InboxDetailsPanel = ({
  messages = [],
  selected = [],
  projectsInfo = {},
  onClose,
}: InboxDetailsPanelProps) => {
  const user = useAppSelector((state) => state.user.name)
  const selectedMessage = useMemo<GroupedMessage | undefined>(() => {
    return messages.find((m) => m.activityId === selected[0])
  }, [messages, selected])

  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: Parameters<typeof openViewer>[0]) => dispatch(openViewer(args))

  const { projectName, entityType, entityId, entitySubType } = selectedMessage || {}

  const { data: users = [] } = useGetUsersAssigneeQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  const projectInfo = projectName ? projectsInfo[projectName] : undefined

  return (
    <>
      <DetailsPanel
        isOpen={!!selected.length}
        entities={[{ id: entityId ?? '', projectName: projectName ?? '' }]}
        tagsOptions={projectInfo?.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        disabledProjectUsers={[]}
        projectsInfo={projectsInfo as Record<string, any>}
        projectNames={projectName ? [projectName] : []}
        onClose={onClose}
        entityType={entityType as 'folder' | 'task' | 'version' | 'representation' | undefined}
        entitySubTypes={entitySubType ? [entitySubType] : undefined}
        scope="inbox"
        onWatchersUpdate={(added) => {
          if (user && added.includes(user)) {
            const name = selectedMessage?.messages?.[0]?.origin?.name
            toast.success(`All future updates for ${name} will appear in your important inbox.`)
          }
        }}
        style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
        onOpenViewer={handleOpenViewer}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo as Record<string, any>} scope="inbox" />
    </>
  )
}

export default InboxDetailsPanel
