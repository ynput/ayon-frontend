import { useSelector } from 'react-redux'
import { useState } from 'react'
import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'
import WorkfileList from './WorkfileList'
import WorkfileDetail from './WorkfileDetail'

const WorkfilesPage = () => {
  const [selectedWorkfile, setSelectedWorkfile] = useState(null)

  const projectName = useSelector((state) => state.context.projectName)
  const focusedTasks = useSelector((state) => state.context.focused.tasks)
  const pairing = useSelector((state) => state.context.pairing)

  return (
    <main>
      <Hierarchy style={{ maxWidth: 500, minWidth: 300 }} />
      <TaskList style={{ maxWidth: 400, minWidth: 400 }} />

      <WorkfileList
        projectName={projectName}
        taskIds={focusedTasks}
        pairing={pairing}
        selectedWorkfile={selectedWorkfile}
        setSelectedWorkfile={setSelectedWorkfile}
        style={{ maxWidth: 500, minWidth: 300 }}
      />

      <WorkfileDetail projectName={projectName} workfileId={selectedWorkfile?.id} />
    </main>
  )
}

export default WorkfilesPage
