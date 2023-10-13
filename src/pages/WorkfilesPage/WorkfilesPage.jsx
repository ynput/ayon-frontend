import { useEffect, useState } from 'react'
import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'
import WorkfileList from './WorkfileList'
import WorkfileDetail from './WorkfileDetail'
import { useSelector } from 'react-redux'

const WorkfilesPage = () => {
  const projectName = useSelector((state) => state.project.name)
  const [selectedWorkfile, setSelectedWorkfile] = useState(null)

  // set SelectedWorkfile to null when projectName changes
  useEffect(() => {
    setSelectedWorkfile(null)
  }, [projectName])

  return (
    <main>
      <Hierarchy style={{ flex: 1, minWidth: 250, maxWidth: 500 }} />
      <TaskList style={{ flex: 0.75, minWidth: 250, maxWidth: 500 }} autoSelect />
      <WorkfileList
        selectedWorkfile={selectedWorkfile}
        setSelectedWorkfile={setSelectedWorkfile}
        style={{ flex: 1, minWidth: 300, maxWidth: 500 }}
      />

      <WorkfileDetail
        workfileId={selectedWorkfile?.id}
        style={{ flex: 1.5, overflow: 'hidden', maxWidth: 500 }}
      />
    </main>
  )
}

export default WorkfilesPage
