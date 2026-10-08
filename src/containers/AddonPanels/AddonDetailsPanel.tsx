import { FC } from 'react'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { detailsPanelEntityTypes, useGetUsersAssigneeQuery } from '@shared/api'
import type { DetailsPanelEntityType } from '@shared/api'
import { useProjectContext } from '@shared/context'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import type { AddonEntity } from './useAddonMessages'

// for a mixed selection, like the overview: versions, then tasks, then folders
const TYPE_PRIORITY: DetailsPanelEntityType[] = ['version', 'task', 'folder', 'representation']

/** The entities of one type the details panel can show, or null. */
export const getDetailsSelection = (selection: AddonEntity[]) => {
  const supported = selection.filter((e) =>
    detailsPanelEntityTypes.includes(e.entityType as DetailsPanelEntityType),
  )
  if (!supported.length) return null
  const types = new Set(supported.map((e) => e.entityType))
  const entityType = TYPE_PRIORITY.find((t) => types.has(t))!
  return { entityType, ids: supported.filter((e) => e.entityType === entityType).map((e) => e.id) }
}

interface AddonDetailsPanelProps {
  selection: AddonEntity[]
  onClose: () => void
}

/** The details panel (comments, attributes) for entities selected in an addon. */
export const AddonDetailsPanel: FC<AddonDetailsPanelProps> = ({ selection, onClose }) => {
  const dispatch = useAppDispatch()
  const { projectName, ...projectInfo } = useProjectContext()
  const { data: users = [] } = useGetUsersAssigneeQuery(
    { names: undefined, projectName },
    { skip: !projectName },
  )

  const details = getDetailsSelection(selection)
  if (!projectName || !details) return null
  const projectsInfo = { [projectName]: projectInfo }

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <>
          <DetailsPanel
            isOpen
            entityType={details.entityType}
            entities={details.ids.map((id) => ({ id, projectName }))}
            projectsInfo={projectsInfo}
            projectNames={[projectName]}
            tagsOptions={projectInfo.tags || []}
            projectUsers={users}
            activeProjectUsers={users}
            style={{ boxShadow: 'none' }}
            scope="addon"
            entityListsContext={entityListsContext}
            onClose={onClose}
            onOpenViewer={(args: any) => dispatch(openViewer(args))}
          />
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="addon" />
        </>
      )}
    </EntityListsContextBoundary>
  )
}
