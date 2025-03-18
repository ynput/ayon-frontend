import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Types
import { BuiltInFieldOptions } from '../../../containers/ProjectTreeTable/ProjectTreeTableColumns'

// Queries
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'

// Components
import ProjectTreeTable from '../../../containers/ProjectTreeTable/ProjectTreeTable'
import { useProjectTableContext } from '../../../containers/ProjectTreeTable/context/ProjectTableContext'

type User = {
  name: string
  attrib: {
    fullName: string
  }
}

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const {
    projectName,
    projectInfo,
    attribFields,
    tableData,
    tasksMap,
    foldersMap,
    showHierarchy,
    isLoading,
    fetchNextPage,
  } = useProjectTableContext()
  const scope = `overview-${projectName}`
  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  const { statuses = [], folderTypes = [], taskTypes = [] } = projectInfo || {}

  const options: BuiltInFieldOptions = useMemo(
    () => ({
      assignees: users.map(({ name, attrib }) => ({
        value: name,
        label: attrib?.fullName || name,
        icon: `/api/users/${name}/avatar`,
      })),
      statuses: statuses.map(({ name, color, icon }) => ({
        value: name,
        label: name,
        color,
        icon,
      })),
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
        scope={scope}
        attribs={attribFields}
        tableData={tableData}
        options={options}
        isLoading={false}
        isExpandable={false}
        sliceId={''}
        // pagination
        fetchMoreOnBottomReached={fetchMoreOnBottomReached}
        // metadata
        tasksMap={tasksMap}
        foldersMap={foldersMap}
      />
    </Section>
  )
}

export default ProjectOverviewTable
