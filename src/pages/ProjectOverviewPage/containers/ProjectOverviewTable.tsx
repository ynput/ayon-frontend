import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Types
import { BuiltInFieldOptions } from '@shared/ProjectTreeTable/ProjectTreeTableColumns'

// Components
import ProjectTreeTable from '@shared/ProjectTreeTable'
import { useProjectTableContext } from '@shared/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const {
    projectName,
    projectInfo,
    attribFields,
    users,
    tasksMap,
    foldersMap,
    showHierarchy,
    isLoading,
    fetchNextPage,
  } = useProjectTableContext()

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  const { statuses = [], folderTypes = [], taskTypes = [], tags = [] } = projectInfo || {}

  const options: BuiltInFieldOptions = useMemo(
    () => ({
      assignees: users.map(({ name, fullName }) => ({
        value: name,
        label: fullName || name,
        icon: `/api/users/${name}/avatar`,
      })),
      statuses: statuses
        .filter(
          (status) => !status.scope || ['folder', 'task'].some((s) => status.scope?.includes(s)),
        )
        .map(({ name, color, icon, scope }) => ({
          value: name,
          label: name,
          color,
          icon,
          scope,
        })),
      tags: tags.map(({ name, color }) => ({ value: name, label: name, color })),
      folderTypes: folderTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
      taskTypes: taskTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
    }),
    [users, statuses, folderTypes, taskTypes],
  )

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement && !showHierarchy) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        //once the user has scrolled within 1000px of the bottom of the table, fetch more data if we can
        if (scrollHeight - scrollTop - clientHeight < 1000 && !isLoading) {
          fetchNextPage()
        }
      }
    },
    [fetchNextPage, isLoading, showHierarchy],
  )

  return (
    <Section style={{ height: '100%' }}>
      <ProjectTreeTable
        projectName={projectName}
        scope={scope}
        attribs={attribFields}
        options={options}
        sliceId={''}
        // pagination
        fetchMoreOnBottomReached={fetchMoreOnBottomReached}
        // metadata
        tasksMap={tasksMap}
        foldersMap={foldersMap}
        onOpenNew={onOpenNew}
      />
    </Section>
  )
}

export default ProjectOverviewTable
