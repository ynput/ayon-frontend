// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import useFocusedEntities from '@hooks/useFocused'
import { useAppDispatch, useAppSelector } from '@state/store'
import { openViewer } from '@state/viewer'
// shared
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery, useGetProjectsInfoQuery, ProjectModel } from '@shared/api'
import {
  setFocusedVersions,
  setSelectedVersions,
  setFocusedFolders,
  setFocusedProducts,
  setFocusedTasks,
  setFocusedWorkfiles,
  setFocusedRepresentations,
  setFocusedType,
} from '@state/context'

const BrowserDetailsPanel = () => {
  const projectName = useAppSelector((state) => state.project.name) as unknown as string

  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })
  const projectInfo = projectsInfo[projectName]

  // if entityType is representation, entityType stays as versions because we use a slide out
  const { entities, entityType, subTypes } = useFocusedEntities(projectName)

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  const updateFocusedVersion = (versionId: string) => {
    // set selected product
    dispatch(setFocusedVersions([versionId]))
    dispatch(setSelectedVersions([versionId]))
  }

  const handleDetailsPanelClose = () => {
    // Clear selection and focus based on the current entity type
    if (entityType === 'folder') {
      dispatch(setFocusedFolders({ ids: [], subTypes: [] }))
    } else if (entityType === 'product') {
      dispatch(setFocusedProducts({ ids: [], subTypes: [] }))
    } else if (entityType === 'task') {
      dispatch(setFocusedTasks({ ids: [], names: [], subTypes: [] }))
    } else if (entityType === 'version') {
      dispatch(setFocusedVersions([]))
      dispatch(setSelectedVersions({}))
    } else if (entityType === 'workfile') {
      dispatch(setFocusedWorkfiles({}))
    } else if (entityType === 'representation') {
      dispatch(setFocusedRepresentations({}))
    }
    setFocusedType(null)
  }

  return (
    <>
      <DetailsPanel
        isOpen={!!entities.length}
        entitySubTypes={subTypes}
        entityType={entityType}
        entities={entities}
        projectsInfo={projectsInfo as Record<string, ProjectModel>}
        projectNames={[projectName]}
        tagsOptions={projectInfo?.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="project"
        onOpenViewer={handleOpenViewer}
        onEntityFocus={updateFocusedVersion}
        onClose={handleDetailsPanelClose}
      />
      <DetailsPanelSlideOut
        projectsInfo={projectsInfo as Record<string, ProjectModel>}
        scope="project"
      />
    </>
  )
}

export default BrowserDetailsPanel
