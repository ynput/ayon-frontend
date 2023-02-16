import { useState } from 'react'
import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'
import WorkfileList from './WorkfileList'
import WorkfileDetail from './WorkfileDetail'

const WorkfilesPage = () => {
  const [selectedWorkfile, setSelectedWorkfile] = useState(null)

  return (
    <main>
      <Hierarchy style={{ flex: 1, minWidth: 250, maxWidth: 500 }} />
      <TaskList style={{ flex: 0.75, minWidth: 250, maxWidth: 500 }} />
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
